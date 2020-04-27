const client = require('../../../helpers/postgresClient');

const carparkModel = require('./../sequelize-models').carpark;
const carparkZoneModel = require('./../sequelize-models').carpark_zone;
const assetModel = require('./../sequelize-models').asset_2;
const assetTypeModel = require('./../sequelize-models').asset_type_2;
const assetModelModel = require('./../sequelize-models').asset_model_2;
const Op = require('./../sequelize-models').Sequelize.Op;
const sequelize  = require('./../sequelize-models').sequelize;

/**
 * Asset / Get Assets
 * @param typeCode
 * @param where
 * @returns {Promise<void>}
 */
const getAssets = async(typeCode, where) => {
        const type = await assetTypeModel
            .findOne({
                where: {
                    code: typeCode,
                },
                attributes: ['id'],
            });
        if (!type) {
            return [];
        }
        const models = await assetModelModel
            .findAll({
                where: {
                    type_id: type.id,
                },
                attributes: ['id'],
            });
        const modelIds = models.map(value => value.id);
        const result = await assetModel
            .findAll({
                where: {
                    model_id: { [Op.in]: modelIds },
                    ...where,
                },
                include: [{
                    model: assetModelModel,
                    as: 'model',
                }],
            });
        result.map((row) => {
            if (row.dataValues.model) {
                row.dataValues.model = row.dataValues.model.name;
            }
            return row;
        });
        return result;
};
/**
 * Asset / Asset All
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const getAll = async (req, res, next) => {
    try {
        const typeCode = req.params.type;
        const where = { status: 'Available' };
        const result = await getAssets(typeCode, where);
        return res.status(200).send(result);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

/**
 * Asset / Asset by Project
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const getAllInstalledByProject = async (req, res, next) => {
    try {
        const typeCode = req.params.type;
        const projectId = req.params.projectId;
        const where = { status: 'Installed', project_id: projectId };
        const result = await getAssets(typeCode, where);
        return res.status(200).send(result);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

/**
 * Asset / Asset by Carpark Zone
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const getAllInstalledByCarparkZone = async (req, res, next) => {
    try {
        const typeCode = req.params.type;
        const carpark_zone_id = req.params.carparkZoneId;
        const where = { status: 'Installed', carpark_zone_id: carpark_zone_id };
        const result = await getAssets(typeCode, where);
        return res.status(200).send(result);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

/**
 * Add new gate
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const create = async (req, res, next) => {
    try {
        const id = req.params.id;

        const asset = await assetModel
            .findOne({
                where: {
                    codification_id: id,
                }
            });
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found!' });
        }
        const {
            latitude, longitude, project_id, zone_id, parking_id, carpark_id, carpark_zone_id
        } = req.body;
        const assetBody = {
            latitude, longitude, project_id, zone_id, parking_id, carpark_id, carpark_zone_id,
            status: 'Installed',
            deployed_at: new Date(),
        };

        await asset.update(assetBody);
        return res.status(202).json({ message: 'Updated.', id: id });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const update = async (req, res, next) => {
    try {
        const id = req.params.id;

        const asset = await assetModel
            .findOne({
                where: {
                    codification_id: id,
                }
            });
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found!' });
        }
        const {
            latitude, longitude
        } = req.body;
        const assetBody = {
            latitude, longitude
        };

        await asset.update(assetBody);
        return res.status(202).json({ message: 'Updated.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const del = async (req, res, next) => {
    try {
        const id = req.params.id;

        const asset = await assetModel
            .findOne({
                where: {
                    codification_id: id,
                }
            });
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found!' });
        }

        const assetBody = {
            project_id: null, zone_id: null, parking_id: null, carpark_id: null, carpark_zone_id: null,
            status: 'Available',
            deployed_at: null,
        };

        await asset.update(assetBody);
        return res.status(202).json({ message: 'Updated.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// New Analytics module Controllers
exports.getAll = getAll;
exports.getAllInstalledByProject = getAllInstalledByProject;
exports.getAllInstalledByCarparkZone = getAllInstalledByCarparkZone;
exports.create = create;
exports.update = update;
exports.del = del;
