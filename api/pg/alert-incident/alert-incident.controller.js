const alertIncedentModel = require('./../sequelize-models').alert_incident;
const Op = require('./../sequelize-models').Sequelize.Op;

const create = async (req, res, next) => {
    try {
        const {
            incident_id, codification_id, latitude, longitude, img_url, note, created_by
        } = req.body;
        const alertIncedentBody = {
            incident_id, codification_id, latitude, longitude, img_url, note, created_by
            // created_at: new Date(),
        };

        const result = await alertIncedentModel.create(alertIncedentBody);
        return res.status(201).json({ message: 'created.', id: result.id });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await alertIncedentModel.findAll();
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getOne = async (req, res, next) => {
    try {
        const alertIncidentById = await alertIncedentModel.findOne({
            where: {
                id: req.params.id,
            }
        });
        if (alertIncidentById) {
            return res.status(200).json(alertIncidentById);
        } else {
            return res.status(404).json('no data found.');
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const alertIncidentToUpdate = await alertIncedentModel
            .findOne({
                where: {
                    id: id,
                }
            });
        if (!alertIncidentToUpdate) {
            return res.status(404).json({ message: 'Alert Incident not found!' });
        }

        const {
            incident_id, codification_id, latitude, longitude, img_url, note, created_by
        } = req.body;
        const alertIncidentBody = {
            incident_id, codification_id, latitude, longitude, img_url, note, created_by
        };

        await alertIncidentToUpdate.update(alertIncidentBody);
        return res.status(202).json({ message: 'Updated.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const del = async (req, res, next) => {
    try {
        const id = req.params.id;
        const deleteResult = await alertIncedentModel.destroy({
            where: { id: id }
          });
        if (deleteResult === 1) {
            return res.status(200).json({
                message: 'Deleted'
            });
        } else {
            const error = new Error('Delete error');
            error.status = 500;
            throw error;
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};


// RESTful apis
exports.create = create;
exports.getAll = getAll;
exports.getOne = getOne;
exports.update = update;
exports.del = del;