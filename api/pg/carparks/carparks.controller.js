const model = require('./carparks.model');
const projectModel = require('./../sequelize-models').project;
const terminalModel = require('./../sequelize-models').terminal;
const projectZoneModel = require('./../sequelize-models').project_zone;
const carparkModel = require('./../sequelize-models').carpark;
const carparkTypeModel = require('./../sequelize-models').list_type_carpark;
const Op = require('./../sequelize-models').Sequelize.Op;

const create = async (req, res, next) => {
    try {
        const {
            project_id, zone_id, terminal_id, type_id,
            code, carpark_name, name_ar, latitude, longitude, connecting_points,
            operation_type, img_url, managed_by, is_automated,
        } = req.body;
        const employee = req._user;
        const carparkBody = {
            project_id, zone_id, terminal_id, type_id,
            code, carpark_name, name_ar, latitude, longitude, connecting_points,
            operation_type, img_url, managed_by, is_automated: is_automated === 'yes',
            created_by: employee.employee_id,
            created_at: new Date(),
        };

        const result = await carparkModel.create(carparkBody);
        return res.status(201).json({ message: 'created.', id: result.id });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

/**
 * Get Next Parking Code from max value
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getParkingCode = async(req, res, next) => {
    try {
        let maxCode = await carparkModel.max('code');
        maxCode = Number.parseInt(maxCode);
        // TODO: format parking code
        return res.status(200).send(`${maxCode+1}`);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getAllCarparkTypes = async(req, res, next) => {
    try {
        const result = await carparkTypeModel.findAll();
        return res.status(200).send(result);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await model.getAll(req.params.map, req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getAllCarparks = async (req, res, next) => {
    try {
        const whereDefaultObj = {deleted_by: { [Op.is]: null }, deleted_at: { [Op.is]: null }};
        let whereTypeObj = {};
        let whereCarparkObj = {};
        if (Object.keys(req.query).length > 0) {
            Object.keys(req.query).forEach((field) => {
                if (field.startsWith('type_')) {
                    if (!field.startsWith('type_not_')) {
                        whereTypeObj[field.replace('type_', '')] = req.query[field];
                    } else {
                        whereTypeObj[field.replace('type_not_', '')] = { [Op.ne] : req.query[field] };
                    }
                } else {
                    if (!field.startsWith('not_')) {
                        whereCarparkObj[field] = req.query[field];
                    } else {
                        whereCarparkObj[field.replace('not_', '')] = { [Op.ne] : req.query[field] };
                    } 
                }
            });
        }
        const result = (await carparkModel.findAll({
            where: (whereCarparkObj) ? { ...whereDefaultObj, ...whereCarparkObj } : { ...whereDefaultObj },
            include: [{
                where: (whereTypeObj) ? { ...whereTypeObj } : null,
                model: carparkTypeModel,
                as: 'carpark_type',
                required: true
            }]
        })).map(row => {
            const {carpark_type} = row.dataValues;
            delete row.dataValues.carpark_type;
            Object.keys(carpark_type.dataValues).forEach(key => {
                row.dataValues[`type_${key}`] = carpark_type.dataValues[key];
            });
            return row.dataValues;
        });
        return res.status(200).json(result);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getCarparks = async(where) => {
    let result = await carparkModel
        .findAll({
            where: where,
            include: [{
                model: projectModel,
                as: 'project',
            },{
                model: projectZoneModel,
                as: 'zone',
            },{
                model: terminalModel,
                as: 'terminal',
            },{
                model: carparkTypeModel,
                as: 'carpark_type',
            }],
        });
    return result.map((row) => {
        let { project, zone, terminal, carpark_type, ...data } = row.dataValues;
        data = project ? { ...data, project: project.dataValues } : data;
        data = zone ? { ...data, zone: zone.dataValues } : data;
        data = terminal ? { ...data, terminal: terminal.dataValues } : data;
        data = carpark_type ? { ...data, carpark_type: carpark_type.dataValues } : data;
        return data;
    });
};

const getAllByProject = async (req, res, next) => {
    try {
        const project_id = req.params.projectId;
        const where = { project_id: project_id };
        const result = await getCarparks(where);
        return res.status(200).send(result);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getAllByProjectZone = async (req, res, next) => {
    try {
        const zone_id = req.params.zoneId;
        const where = { zone_id: zone_id };
        const result = await getCarparks(where);
        return res.status(200).send(result);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getAllByTerminal = async (req, res, next) => {
    try {
        const terminal_id = req.params.terminalId;
        const where = { terminal_id: terminal_id };
        const result = await getCarparks(where);
        return res.status(200).send(result);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getOne = async (req, res, next) => {
    try {
        const group_violation_id = req.params.id;
        const result = await model.getOne(group_violation_id);
        if(result.rows.length === 0) {
            const error = new Error('This Carpark doesn\'t exist');
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json(result.rows[0]);
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

        const carpark = await carparkModel
            .findOne({
                where: {
                    id: id,
                }
            });
        if (!carpark) {
            const error = new Error('Carpark not found!');
            error.statusCode = 404;
            throw error;
        }

        const {
            project_id, zone_id, terminal_id, type_id,
            code, carpark_name, name_ar, latitude, longitude, connecting_points,
            operation_type, img_url, managed_by, is_automated,
        } = req.body;
        const carparkBody = {
            project_id, zone_id, terminal_id, type_id,
            code, carpark_name, name_ar, latitude, longitude, connecting_points,
            operation_type, img_url, managed_by, is_automated: is_automated === 'yes',
        };

        await carpark.update(carparkBody);
        return res.status(201).json({ message: 'Updated.' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const del = async (req, res, next) => {
    try {
        const id = req.params.id;
        const responseGet = await model.getOne(id);
        if (responseGet.rows.length === 0) {
            const error = new Error('This Carpark doesn\'t exist');
            error.statusCode = 404;
            throw error;
        }
        await model.delete(id, req._user.employee_id);
        return res.status(200).json({
            message: 'deleted.'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.create = create;
exports.getParkingCode = getParkingCode;
exports.getAllCarparkTypes = getAllCarparkTypes;
exports.getAll = getAll;
exports.getAllCarparks = getAllCarparks;
exports.getAllByProject = getAllByProject;
exports.getAllByProjectZone = getAllByProjectZone;
exports.getAllByTerminal = getAllByTerminal;
exports.getOne = getOne;
exports.update = update;
exports.del = del;
