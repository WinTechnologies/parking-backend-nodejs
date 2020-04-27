const carparkModel = require('./../sequelize-models').carpark;
const carparkLevelModel = require('./../sequelize-models').carpark_level;
const carparkZoneModel = require('./../sequelize-models').carpark_zone;
const parkspaceModel = require('./../sequelize-models').parkspace;

const Sequelize = require('./../sequelize-models').Sequelize;
const Op = require('./../sequelize-models').Sequelize.Op;

const create = async (req, res, next) => {
    try {
        const {
            carpark_id, level_id, name_en, name_ar, latitude, longitude, connecting_points,
            img_url, area, perimeter, measurement_unit, n_parking_lots
        } = req.body;
        const employee = req._user;
        const gateBody = {
            carpark_id, level_id, name_en, name_ar, connecting_points, area, perimeter, measurement_unit,
            created_by: employee.employee_id,
            created_at: new Date(),
        };

        const result = await carparkZoneModel.create(gateBody);
        return res.status(201).json({ message: 'created.', id: result.id });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await model.getAll(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getCarparkZones = async(where) => {
    let result = await carparkZoneModel
        .findAll({
            where: where,
            group : ['carpark.id', 'carpark_level.id', 'carpark_zone.id'],
            attributes: {
                include: [[Sequelize.fn('count', Sequelize.col('parkspaces.id')), 'n_parking_lots']],
            },
            include: [{
                model: carparkModel, as: 'carpark',
            }, {
                model: carparkLevelModel, as: 'carpark_level',
            }, {
                model: parkspaceModel, as: 'parkspaces', attributes: [],
            }],
        });
    return result.map((row) => {
        let { carpark, carpark_level, ...data } = row.dataValues;
        data = carpark ? { ...data, carpark: carpark.dataValues } : data;
        data = carpark_level ? { ...data, carpark_level: carpark_level.dataValues } : data;
        return data;
    });
};

const getAllByCarparkLevel = async (req, res, next) => {
    try {
        const level_id = req.params.levelId;
        const where = { level_id: level_id, deleted_at: null };
        const result = await getCarparkZones(where);
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
        const where = {
            carpark_id: carpark_id,
            deleted_at: { [Op.is]: null },
        };
        const result = await getCarparkZones(where);
        return res.status(200).send(result);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
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
        const where = {
            carpark_id: { [Op.in]: carparkLibIds },
            deleted_at: { [Op.is]: null },
        };
        const result = await getCarparkZones(where);
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getOne = async (req, res, next) => {
    try {
        const id = req.params.id;
        const carpark_zone = await carparkZoneModel
            .findOne({
                where: {
                    id: id,
                },
                include: [{
                    model: carparkModel,
                    as: 'carpark',
                },{
                    model: carparkLevelModel,
                    as: 'carpark_level',
                }],
            });
        return res.status(200).send(carpark_zone);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const update = async (req, res, next) => {
    try {
        const id = req.params.id;

        const carpark_zone = await carparkZoneModel
            .findOne({
                where: {
                    id: id,
                }
            });
        if (!carpark_zone) {
            return res.status(404).json({ message: 'Carpark zone not found!' });
        }

        const {
            carpark_id, level_id, name_en, name_ar, latitude, longitude, connecting_points,
            img_url, area, perimeter, measurement_unit, n_parking_lots
        } = req.body;
        const carparkZoneBody = {
            carpark_id, level_id, name_en, name_ar, connecting_points, area, perimeter, measurement_unit,
        };

        await carpark_zone.update(carparkZoneBody);
        return res.status(201).json({ message: 'Updated.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const del = async (req, res, next) => {
    try {
        const id = req.params.id;
        const carpark_zone = await carparkZoneModel
            .findOne({
                where: {
                    id: id,
                }
            });
        if (!carpark_zone) {
            const error = new Error('This carpark zone doesn\'t exist');
            error.statusCode = 404;
            throw error;
        }
        const employee = req._user;
        const carparkZoneBody = {
            deleted_by: employee.employee_id,
            deleted_at: new Date(),
        };

        await carpark_zone.update(carparkZoneBody);
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

exports.create = create;
exports.getAll = getAll;
exports.getAllByCarparkLevel = getAllByCarparkLevel;
exports.getAllByCarpark = getAllByCarpark;
exports.getAllByProject = getAllByProject;
exports.getOne = getOne;
exports.update = update;
exports.del = del;
