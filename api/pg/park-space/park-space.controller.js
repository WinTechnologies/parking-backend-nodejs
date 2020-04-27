const client = require('../../../helpers/postgresClient');

const carparkModel = require('./../sequelize-models').carpark;
const carparkZoneModel = require('./../sequelize-models').carpark_zone;
const parkspaceModel = require('./../sequelize-models').parkspace;
const vehicleTypeModel = require('./../sequelize-models').vehicle_type;
const Op = require('./../sequelize-models').Sequelize.Op;
const sequelize  = require('./../sequelize-models').sequelize;

/**
 * park space / All park space
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const getAll = async (req, res, next) => {
    try {
        const result = await parkspaceModel
            .findAll({
                include: [{
                    model: carparkZoneModel,
                    as: 'carpark_zone',
                },{
                    model: vehicleTypeModel,
                    as: 'vehicle_type',
                }],
            });
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getParkSpaces = async (where) => {
    let result = await parkspaceModel
        .findAll({
            where: where,
            include: [{
                model: carparkZoneModel,
                as: 'carpark_zone',
            },{
                model: vehicleTypeModel,
                as: 'vehicle_type',
            }],
        });
    return result.map((row) => {
        let { carpark_zone, vehicle_type, ...data } = row.dataValues;
        data = carpark_zone ? { ...data, carpark_zone: carpark_zone.dataValues } : data;
        data = vehicle_type ? { ...data, vehicle_type: vehicle_type.dataValues } : data;
        return data;
    });
};

/**
 * park space / park space by Project
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
        const where = { carpark_zone_id: { [Op.in]: carparkZoneLibIds }, deleted_at: null };
        const result = await getParkSpaces(where);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * park space / park space by Carpark Zone
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const getAllByCarparkZone = async (req, res, next) => {
    try {
        const carpark_zone_id = req.params.carparkZoneId;
        const where = { carpark_zone_id: carpark_zone_id, deleted_at: null };
        const result = await getParkSpaces(where);
        return res.status(200).send(result);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

/**
 * Get Next Park Space Code from max value
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getCode = async(req, res, next) => {
    try {
        let maxCode = await parkspaceModel.max('code');
        maxCode = Number.parseInt(maxCode);
        return res.status(200).send(`${maxCode+1}`);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

/**
 * Add new park space
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const create = async (req, res, next) => {
    try {
        const {
            code, name, img_url, notes, carpark_zone_id, for_handicap, is_sensor, vehicle_type_id , latitude, longitude, connecting_points, perimeter, area, measurement_unit
        } = req.body;
        const employee = req._user;
        const parkspaceBody = {
            code, name, img_url, notes, carpark_zone_id, for_handicap, is_sensor, vehicle_type_id, // latitude, longitude, connecting_points,
            created_by: employee.employee_id,
            created_at: new Date(),
        };

        const result = await parkspaceModel.create(parkspaceBody);
        return res.status(201).json({ message: 'created.', id: result.id });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const update = async (req, res, next) => {
    try {
        const id = req.params.id;

        const parkspace = await parkspaceModel
            .findOne({
                where: {
                    id: id,
                }
            });
        if (!parkspace) {
            return res.status(404).json({ message: 'Park Space not found!' });
        }

        const {
            code, name, img_url, notes, carpark_zone_id, for_handicap, is_sensor, vehicle_type_id , latitude, longitude, connecting_points, perimeter, area, measurement_unit
        } = req.body;
        const parkspaceBody = {
            code, name, img_url, notes, carpark_zone_id, for_handicap, is_sensor, vehicle_type_id //, latitude, longitude, connecting_points
        };

        await parkspace.update(parkspaceBody);
        return res.status(201).json({ message: 'Updated.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const del = async (req, res, next) => {
    try {
        const id = req.params.id;
        const parkspace = await parkspaceModel
            .findOne({
                where: {
                    id: id,
                }
            });
        if (!parkspace) {
            const error = new Error('This park space doesn\'t exist');
            error.statusCode = 404;
            throw error;
        }
        const employee = req._user;
        const parkspaceBody = {
            deleted_by: employee.employee_id,
            deleted_at: new Date(),
        };

        await parkspace.update(parkspaceBody);
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
exports.getCode = getCode;
exports.create = create;
exports.update = update;
exports.del = del;
