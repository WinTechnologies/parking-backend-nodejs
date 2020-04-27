const alertAccidentModel = require('../sequelize-models').alert_accident;
const assetModel = require('../sequelize-models').asset_2;
const enforcerStatusModel = require('../sequelize-models').list_enforcer_status;

const create = async (req, res, next) => {
    try {
        const {
            name_en, name_ar, description, latitude, longitude, vehicle_codification_id,
            vehicle_plate_en, vehicle_plate_ar, user_status_id, accident_pictures, reported_by
        } = req.body;

        const alertAccidentBody = {
            name_en, name_ar, description, latitude, longitude, vehicle_codification_id,
            vehicle_plate_en, vehicle_plate_ar, user_status_id, accident_pictures, reported_by
        };

        const result = await alertAccidentModel.create(alertAccidentBody);
        return res.status(201).json({ message: 'Created.', id: result.id });
    } catch (err) {
        next(err);
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await alertAccidentModel.findAll();
        return res.status(200).send(result);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const alertAccidentById = await alertAccidentModel.findOne({
            where: {
                id: req.params.id
            },
            include : [
                { model: assetModel, as: 'asset' },
                { model: enforcerStatusModel, as: 'user_status' }
            ]
        });
        if (alertAccidentById) {
            return res.status(200).json(alertAccidentById);
        } else {
            return res.status(404).json({ message: 'No alert accident was found by id.' });
        }
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const alertAccidentUpdate = await alertAccidentModel
            .findOne({
                where: {
                    id: id
                }
            });
        if (!alertAccidentUpdate) {
            return res.status(404).json({ message: 'Alert accident not found!' });
        }

        const {
            name_en, name_ar, description, latitude, longitude, vehicle_codification_id,
            vehicle_plate_en, vehicle_plate_ar, user_status_id, accident_pictures, reported_by
        } = req.body;

        const updateBody = {
            name_en, name_ar, description, latitude, longitude, vehicle_codification_id,
            vehicle_plate_en, vehicle_plate_ar, user_status_id, accident_pictures, reported_by
        };

        await alertAccidentUpdate.update(updateBody);
        return res.status(200).json({ message: 'Updated.' });
    } catch (err) {
        next(err);
    }
};

exports.create = create;
exports.getAll = getAll;
exports.getById = getById;
exports.update = update;
