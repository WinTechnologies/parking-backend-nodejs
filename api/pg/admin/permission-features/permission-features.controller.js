const model = require('./permission-features.model');

const create = async (req, res, next) => {
    try {
        await model.create(req.body);
        return res.status(201).json({
            message: 'Permission Feature created successfully'
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
        const result = await  model.getAll(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getOne = async (req, res, next) => {
    try {
        const id = +req.params.id;
        const response = await model.getOne(id);
        if (response.rows.length === 0) {
            const error = new Error('Could not find Permission Feature');
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json(response.rows[0]);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const id = +req.params.id;
        const responseGet = await model.getOne(id);
        if (responseGet.rows.length === 0) {
            const error = new Error('Could not find Permission Feature');
            error.statusCode = 404;
            throw error;
        }
        const responseUpdate = await model.update(id, req.body);
        return res.status(200).json({
            message: 'Permission Feature updated'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const del = async (req, res, next) => {
    try {
        const id = +req.params.id;
        const responseGet = await model.getOne(id);
        if (responseGet.rows.length === 0) {
            const error = new Error('Could not find Permission Feature');
            error.statusCode = 404;
            throw error;
        }
        const responseDelete = await model.delete(id);
        return res.status(200).json({
            message: 'Deleted Permission Feature'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getAvailableSections = async (req, res, next) => {
    try {
        const response = await model.getAvailableSections();
        if (response.rows.length === 0) {
            const error = new Error('Could not find the available sections');
            error.statusCode = 404;
            throw error;
        }
        const sections = response.rows.map((row) => row.section);
        return res.status(200).json(sections);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

// RESTful apis
exports.create = create;
exports.getAll = getAll;
exports.getOne = getOne;
exports.update = update;
exports.del = del;

// Custom apis
exports.getAvailableSections = getAvailableSections;