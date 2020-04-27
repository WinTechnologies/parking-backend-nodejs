const model = require('./carpark-levels.model');
const carparkModel = require('./../sequelize-models').carpark;
const carparkLevelModel = require('./../sequelize-models').carpark_level;
const carparkZoneModel = require('./../sequelize-models').carpark_zone;
const parkspaceModel = require('./../sequelize-models').parkspace;

const Sequelize = require('./../sequelize-models').Sequelize;
const Op = require('./../sequelize-models').Sequelize.Op;

const create = async (req, res, next) => {
    try {
        const {
            project_id, zone_id, terminal_id, carpark_id,
            code, name, connecting_points, img_url, notes
        } = req.body;
        const employee = req._user;
        const levelBody = {
            carpark_id, code, name, img_url, connecting_points,
            created_by: employee.employee_id,
            created_at: new Date(),
        };
        const result = await carparkLevelModel.create(levelBody);
        return res.status(201).json({ message: 'created.', id: result.id });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getCarparkLevels = async(where) => {
    let result = await carparkLevelModel
        .findAll({
            where: where,
            group : ['carpark.id', 'carpark_level.id'],
            attributes: {
                include: [[Sequelize.fn('count', Sequelize.col('carpark_zones->parkspaces.id')), 'n_parking_lots']],
                // exclude: Object.keys(carparkZoneModel.rawAttributes).map(el => 'carpark_zones.' + el),
            },
            include: [{
                model: carparkModel, as: 'carpark',
            }, {
                model: carparkZoneModel, as: 'carpark_zones', attributes: [],
                include:[{
                    model: parkspaceModel, as: 'parkspaces', attributes: [],
                }]
            }],
        });
    return result.map((row) => {
        let { carpark, carpark_zones, ...data } = row.dataValues;
        data = carpark? { ...data, carpark: carpark.dataValues } : data;
        data = carpark_zones && carpark_zones.length
            ? {
                ...data,
                carpark_zones: carpark_zones.map(z => z.dataValues),
            }
            : data;

        return data;
    });
};

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
        const where = { carpark_id: { [Op.in]: carparkLibIds }, deleted_at: null };
        const result = await getCarparkLevels(where);
        return res.status(200).send(result);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getAllByCarpark = async (req, res, next) => {
    try {
        const carpark_id = req.params.carparkId;
        const where = { carpark_id: carpark_id };
        const result = await getCarparkLevels(where);
        return res.status(200).send(result);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};


/**
 * Get Next Level Code from max value
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getLevelCode = async(req, res, next) => {
    try {
        let maxCode = await carparkLevelModel.max('code');
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

const update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const level = await carparkLevelModel
            .findOne({ where: { id } });
        if (!level) {
            const error = new Error('Level not found!');
            error.statusCode = 404;
            throw error;
        }

        const {
            project_id, zone_id, terminal_id, carpark_id,
            code, name, connecting_points, img_url, notes
        } = req.body;
        const levelBody = { carpark_id, code, name, img_url, connecting_points };

        await level.update(levelBody);
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
exports.getAllByProject = getAllByProject;
exports.getAllByCarpark = getAllByCarpark;
exports.getLevelCode = getLevelCode;
exports.update = update;
exports.del = del;
