const model = require('./project-terminal.model');
const client = require('../../../helpers/postgresClient');

const employeeModel = require('./../sequelize-models').employee;
const airportModel = require('./../sequelize-models').airport;
const projectModel = require('./../sequelize-models').project;
const terminalModel = require('./../sequelize-models').terminal;
const projectZoneModel = require('./../sequelize-models').project_zone;
const Op = require('./../sequelize-models').Sequelize.Op;
const sequelize  = require('./../sequelize-models').sequelize;

/**
 * Terminal / All Terminal
 *  Get current authorized user's reports(from terminal)
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const getAll = async (req, res, next) => {
    try {
        const result = await terminalModel
            .findAll({
                include: [{
                    model: projectModel,
                    as: 'project',
                },{
                    model: projectZoneModel,
                    as: 'zone',
                }],
            });
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getTerminals = async (where) => {
    let result = await terminalModel
        .findAll({
            where: where,
            include: [{
                model: projectModel,
                as: 'project',
            },{
                model: projectZoneModel,
                as: 'zone',
            }],
        });

    return result.map((row) => {
        let { project, zone, ...data } = row.dataValues;
        data = project ? { ...data, project: project.dataValues } : data;
        data = zone ? { ...data, zone: zone.dataValues } : data;
        return data;
    });
};

/**
 * Terminal / Terminal by Project
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const getAllByProject = async (req, res, next) => {
    try {
        const project_id = req.params.projectId;
        const where = { project_id: project_id };
        const result = await getTerminals(where);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Terminal / Terminal by Project Zone
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const getAllByProjectZone = async (req, res, next) => {
    try {
        const zone_id = req.params.zoneId;
        const where = { zone_id: zone_id };
        const result = await getTerminals(where);
        return res.status(200).send(result);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

/**
 * Get Next Terminal Code from max value
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getTerminalCode = async(req, res, next) => {
    try {
        let maxCode = await terminalModel.max('terminal_code');
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
 * Get Airport Code
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getAirports = async(req, res, next) => {
    try {
        const query = req.query;
        const result = await airportModel
            .findAll({
                // Case-sensitive search - WHERE name like '%name%'
                // where: { name: {[Op.like]: `%${query.name}%`} }

                // Case-insensitive search - WHERE LOWER(name) like '%name%')
                where: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('name')),
                    { [Op.like]: `%${query.name}%` }
                ),
                limit: 50
            });
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Add new terminal
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const create = async (req, res, next) => {
    try {
        const {
            terminal_code, terminal_name, airport_code, airport_name,
            latitude, longitude, connecting_points, img_url, notes, project_id, zone_id
        } = req.body;
        const employee = req._user;
        const terminalBody = {
            terminal_code, terminal_name, airport_code, airport_name,
            latitude, longitude, connecting_points, img_url, notes, project_id, zone_id,
            created_by: employee.employee_id,
            created_at: new Date(),
        };

        const result = await terminalModel.create(terminalBody);
        return res.status(201).json({ message: 'created.', id: result.id });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const update = async (req, res, next) => {
    try {
        const id = req.params.id;

        const terminal = await terminalModel
            .findOne({
                where: {
                    id: id,
                }
            });
        if (!terminal) {
            return res.status(404).json({ message: 'Terminal not found!' });
        }

        const {
            terminal_code, terminal_name, airport_code, airport_name,
            latitude, longitude, connecting_points, img_url, notes, project_id, zone_id
        } = req.body;
        const terminalBody = {
            terminal_code, terminal_name, airport_code, airport_name,
            latitude, longitude, connecting_points, img_url, notes, project_id, zone_id,
        };

        await terminal.update(terminalBody);
        return res.status(201).json({ message: 'Updated.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const del = async (req, res, next) => {
    try {
        const id = req.params.id;
        const responseGet = await model.getOne(id);
        if (responseGet.rows.length === 0) {
            const error = new Error('This Terminal doesn\'t exist');
            error.statusCode = 404;
            throw error;
        }
        await terminalModel.destroy({
            where: {
                id: id,
            }
        });
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

exports.getAll = getAll;
exports.getAllByProject = getAllByProject;
exports.getAllByProjectZone = getAllByProjectZone;
exports.create = create;
exports.update = update;
exports.del = del;
exports.getTerminalCode = getTerminalCode;
exports.getAirports = getAirports;
