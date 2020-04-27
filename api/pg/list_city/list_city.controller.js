const model = require('./list_city.model');

const create = async (req, res, next) => {
    try {
        await model.create(req.body);
        return res.status(201).json({
            message: 'created.'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
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

const getAllWithProjects = async (req, res, next) => {
    try {
        const cities = await model.getAllWithProjects(req.query);
        const result = {};
        cities.rows.forEach((city) => {
            const { city_code, city_code_pin, city_name, ...project } = city;
            if (!result[city_name]) {
                result[city_name] = {
                    city_code: city_code,
                    city_code_pin: city_code_pin,
                    city_name: city_name,
                    project_number: 0,
                    projects: []
                }
            }
            result[city_name].project_number += 1;
            result[city_name].projects.push(project);
        });

        return res.status(200).json(Object.values(result));
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getOne = async (req, res, next) => {
    try {
        const result = await model.getOne(req.params.city_code);
        if(result.rows.length === 0) {
            const error = new Error('This List City doesn\'t exist');
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const city_code = req.params.city_code;
        const responseGetAll = await model.getAll({city_code: city_code});
        if (responseGetAll.rows.length === 0) {
            const error = new Error('This List City doesn\'t exist');
            error.statusCode = 404;
            throw error;
        }
        await model.update(city_code, req.body);
        return res.status(202).json({message: 'updated.'});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const del = async (req, res, next) => {
    try {
        const city_code = req.params.city_code;
        if (city_code) {
            const responseGetAll = await model.getAll({city_code: city_code});
            if (responseGetAll.rows.length === 0) {
                const error = new Error('This List City doesn\'t exist');
                error.statusCode = 404;
                throw error;
            }
            await model.delete(city_code);
            return res.status(202).json({
                message: 'deleted.'
            });
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.create = create;
exports.getAll = getAll;
exports.getAllWithProjects = getAllWithProjects;
exports.getOne = getOne;
exports.update = update;
exports.del = del;
