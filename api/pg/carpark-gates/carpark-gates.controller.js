const client = require('../../../helpers/postgresClient');

const carparkModel = require('./../sequelize-models').carpark;
const carparkZoneModel = require('./../sequelize-models').carpark_zone;
const gateModel = require('./../sequelize-models').gate;
const Op = require('./../sequelize-models').Sequelize.Op;
const sequelize  = require('./../sequelize-models').sequelize;

/**
 * Gate / All Gate
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const getAll = async (req, res, next) => {
    try {
        const result = await gateModel
            .findAll({
                include: [{
                    model: carparkZoneModel,
                    as: 'carpark_zone',
                }],
            });
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getGates = async (where) => {
    let result = await gateModel
        .findAll({
            where: where,
            include: [{
                model: carparkZoneModel,
                as: 'carpark_zone',
            }],
        });
    return result.map((row) => {
        let { carpark_zone, ...data } = row.dataValues;
        data = carpark_zone ? { ...data, carpark_zone: carpark_zone.dataValues } : data;
        return data;
    });
};

/**
 * Gate / Gate by Project
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const getAllByProject = async (req, res, next) => {
    try {
        const project_id = req.params.projectId;
        const carparkIds = await carparkModel
            .findAll({
                where: {
                    project_id: project_id,
                },
                attributes: ['id'],
            });
        const carparkLibIds = carparkIds.map(value => value.id);
        const carparkZoneIds = await carparkZoneModel
            .findAll({
                where: {
                    carpark_id: { [Op.in]: carparkLibIds },
                },
                attributes: ['id'],
            });
        const carparkZoneLibIds = carparkZoneIds.map(value => value.id);
        const where = {
            carpark_zone_id: { [Op.in]: carparkZoneLibIds },
            deleted_at: { [Op.is]: null },
        };
        const result = await getGates(where);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Gate / Gate by Carpark Zone
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const getAllByCarparkZone = async (req, res, next) => {
    try {
        const carpark_zone_id = req.params.carparkZoneId;
        const where = {
            carpark_zone_id: carpark_zone_id,
            deleted_at: { [Op.is]: null },
        };
        const result = await getGates(where);
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
        const {
            name_en, name_ar, latitude, longitude, connecting_points, img_url, carpark_zone_id
        } = req.body;
        const employee = req._user;
        const gateBody = {
            name_en, name_ar, latitude, longitude, connecting_points, img_url, carpark_zone_id,
            created_by: employee.employee_id,
            created_at: new Date(),
        };

        const result = await gateModel.create(gateBody);
        return res.status(201).json({ message: 'created.', id: result.id });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const update = async (req, res, next) => {
    try {
        const id = req.params.id;

        const gate = await gateModel
            .findOne({
                where: {
                    id: id,
                }
            });
        if (!gate) {
            return res.status(404).json({ message: 'Gate not found!' });
        }

        const {
            name_en, name_ar, latitude, longitude, connecting_points, img_url, carpark_zone_id
        } = req.body;
        const gateBody = {
            name_en, name_ar, latitude, longitude, connecting_points, img_url, carpark_zone_id
        };

        await gate.update(gateBody);
        return res.status(202).json({ message: 'Updated.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const del = async (req, res, next) => {
    try {
        const id = req.params.id;
        const gate = await gateModel
            .findOne({
                where: {
                    id: id,
                }
            });
        if (!gate) {
            const error = new Error('This Gate doesn\'t exist');
            error.statusCode = 404;
            throw error;
        }
        const employee = req._user;
        const gateBody = {
            deleted_by: employee.employee_id,
            deleted_at: new Date(),
        };

        await gate.update(gateBody);
        return res.status(200).json({
            message: 'success'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

// New Analytics module Controllers
exports.getAll = getAll;
exports.getAllByProject = getAllByProject;
exports.getAllByCarparkZone = getAllByCarparkZone;
exports.create = create;
exports.update = update;
exports.del = del;
