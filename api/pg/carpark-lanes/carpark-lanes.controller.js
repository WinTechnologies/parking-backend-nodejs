const client = require('../../../helpers/postgresClient');

const laneModel = require('./../sequelize-models').lane;
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
        const result = await laneModel
            .findAll({
                include: [{
                    model: gateModel,
                    as: 'gate',
                }],
            });
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getLanes = async (where) => {
    let result = await laneModel
        .findAll({
            where: where,
            include: [{
                model: gateModel,
                as: 'gate',
            }],
        });
    return result.map((row) => {
        let { gate, ...data } = row.dataValues;
        data = gate ? { ...data, gate: gate.dataValues } : data;
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
        const gateIds = await gateModel
            .findAll({
                where: {
                    carpark_zone_id: { [Op.in]: carparkZoneLibIds },
                },
                attributes: ['id'],
            });
        const gateLibIds = gateIds.map(value => value.id);
        const where = { gate_id: { [Op.in]: gateLibIds }, deleted_at: null };
        const result = await getLanes(where);
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
const getAllByGate = async (req, res, next) => {
    try {
        const gate_id = req.params.gateId;
        const where = { gate_id: gate_id, deleted_at: null };
        const result = await getLanes(where);
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
            name_en, name_ar, latitude, longitude, connecting_points, gate_id
        } = req.body;
        const employee = req._user;
        const laneBody = {
            name_en, name_ar, latitude, longitude, connecting_points, gate_id,
            created_by: employee.employee_id,
            created_at: new Date(),
        };

        const result = await laneModel.create(laneBody);
        return res.status(201).json({ message: 'created.', id: result.id });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const update = async (req, res, next) => {
    try {
        const id = req.params.id;

        const lane = await laneModel
            .findOne({
                where: {
                    id: id,
                }
            });
        if (!lane) {
            return res.status(404).json({ message: 'Lane not found!' });
        }

        const {
            name_en, name_ar, latitude, longitude, connecting_points, gate_id
        } = req.body;
        const laneBody = {
            name_en, name_ar, latitude, longitude, connecting_points, gate_id
        };

        await lane.update(laneBody);
        return res.status(201).json({ message: 'Updated.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const del = async (req, res, next) => {
    try {
        const id = req.params.id;
        const lane = await laneModel
            .findOne({
                where: {
                    id: id,
                }
            });
        if (!lane) {
            const error = new Error('This lane doesn\'t exist');
            error.statusCode = 404;
            throw error;
        }
        const employee = req._user;
        const laneBody = {
            deleted_by: employee.employee_id,
            deleted_at: new Date(),
        };

        await lane.update(laneBody);
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
exports.getAllByGate = getAllByGate;
exports.create = create;
exports.update = update;
exports.del = del;
