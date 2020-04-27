const sequelize = require('../sequelize-models').sequelize;
const contraventionModel = require('../sequelize-models').contravention;
const cnChallengeModel = require('../sequelize-models').cn_challenge;
const cnReviewModel = require('../sequelize-models').cn_review;
const mqttPublisher = require('../../services/MQTT/publisher');
const mqttTopic = require('../../contravention/constants').MqttSubject;

const getAll = (req, res) => {
    const values = req.query;
    const fields = Object.keys(values);
    let query = {};
    fields.forEach(x => {
        query[x] = values[x]
    });
    return cnReviewModel
        .findAll({
            where: query
        })
        .then((results) => res.status(200).send(results))
        .catch((error) => { res.status(400).send(error); });
};

const getCnReviewById = (req, res) => {
    return cnReviewModel
        .findByPk(req.params.id, {
            include: [{
                model: cnReviewModel
            }],
        })
        .then((result) => {
            if (!result) {
                return res.status(404).send({
                    message: 'Not Found',
                });
            }
            return res.status(200).send(result);
        })
        .catch((error) => res.status(400).send(error));
};

const create = (req, res) => {
    const values = req.body;
    const fields = Object.keys(values);
    let body = {};
    fields.forEach(x => {
        if (x !== 'id' && values[x] !== null) {
            body[x] = values[x]
        }
    });

    return cnReviewModel
        .create(body)
        .then((result) => res.status(201).send(result))
        .catch((error) => res.status(400).send(error));
};

const update = (req, res) => {
    return cnReviewModel
        .findByPk(req.params.id, {
            include: [{
                model: cnReviewModel
            }],
        })
        .then(result => {
            if (!result) {
                return res.status(404).send({
                    message: 'Not Found',
                });
            }
            return result
                .update({
                    class_name: req.body.class_name || classroom.class_name,
                })
                .then(() => res.status(200).send(result))
                .catch((error) => res.status(400).send(error));
        })
        .catch((error) => res.status(400).send(error));
};

const validate = async (req, res) => {
    try {
        const contravention = await contraventionModel.findByPk(req.params.id);
        if (!contravention) {
            return res.status(404).send({
                message: 'Not Found',
            });
        }
        const reviewer = req._user.employee_id;

        const strModifiedData = req.body.data_modification;
        const modifiedData = JSON.parse(strModifiedData);
        const newStatus = Object.keys(modifiedData).length === 0 ? 'Validated' : 'Modified';

        const results = await sequelize.transaction(async (t) => {
            return await Promise.all([
                contravention.update({
                    status_review: newStatus,
                }, {
                    transaction: t,
                }),

                cnReviewModel.create({
                    cn_number: contravention.dataValues.cn_number,
                    data_modification: strModifiedData,
                    decision: newStatus,
                    error: req.body.error,
                    reviewed_by: reviewer,
                    reviewed_at: new Date(),
                }, {
                    transaction: t,
                }),
            ]);
        });


        // MQTT - publisher
        mqttPublisher.client.publish(
            mqttTopic.UpdatedCN,
            JSON.stringify(results[0])
        );
        res.status(200).send(results);
    } catch (err) {
        res.status(400).send(err);
    }
};

const challenge = async (req, res) => {
    try {
        const contravention = await contraventionModel.findByPk(req.params.id);
        if (!contravention) {
            return res.status(404).send({
                message: 'Not Found',
            });
        }
        const reviewer = req._user.employee_id;
        const results = await sequelize.transaction(async (t) => {
            const review = await cnReviewModel.create({
                cn_number: contravention.dataValues.cn_number,
                data_modification: req.body.data_modification,
                decision: 'Challenge requested',
                error: req.body.error,
                reviewed_by: reviewer,
                reviewed_at: new Date(),
                has_challenge: 'true',
                challenge_reason: req.body.challenge_reason,
            }, {
                transaction: t,
            });

            return await Promise.all([
                contravention.update({
                    status_review: 'Challenge requested',
                    status_challenge: 'Challenge requested',
                }, {
                    transaction: t,
                }),
                review,
                cnChallengeModel.create({
                    cn_number: contravention.dataValues.cn_number,
                    review_id: review.dataValues.id,
                    decision: 'Pending',
                    decision_reason: req.body.decision_reason,
                    requested_by: reviewer,
                    requested_at: new Date(),
                }, {
                    transaction: t,
                }),
            ]);
        });

        // MQTT - publisher
        mqttPublisher.client.publish(
            mqttTopic.UpdatedCN,
            JSON.stringify(results[0])
        );
        res.status(200).send(results);
    } catch (err) {
        res.status(400).send(err);
    }
};

exports.getAll = getAll;
exports.getCnReviewById = getCnReviewById;
exports.create = create;
exports.update = update;
exports.validate = validate;
exports.challenge = challenge;