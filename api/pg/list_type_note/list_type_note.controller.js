const model = require('./list_type_note.model');

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

const getWithNoEnforcementType = async (req, res, next) => {
    try {
        const response = await model.getWithNoEnforcementType();
        return res.status(200).json(response.rows)
    } catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getOne = async (req, res, next) => {
    try {
        const result = await model.getOne(req.params.id);
        if(result.rows.length === 0) {
            const error = new Error('This List Type Note doesn\'t exist');
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
        const id = req.params.id;
        const responseGetAll = await model.getAll({id: id});
        if (responseGetAll.rows.length === 0) {
            const error = new Error('This List Type Note doesn\'t exist');
            error.statusCode = 404;
            throw error;
        }
        await model.update(id, req.body);
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
        const id = req.params.id;
        if (id) {
            const responseGetAll = await model.getAll({id: id});
            if (responseGetAll.rows.length === 0) {
                const error = new Error('This List Type Note doesn\'t exist');
                error.statusCode = 404;
                throw error;
            }
            await model.delete(id);
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
exports.getWithNoEnforcementType = getWithNoEnforcementType;
exports.getOne = getOne;
exports.update = update;
exports.del = del;