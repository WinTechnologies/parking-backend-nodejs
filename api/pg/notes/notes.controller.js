const model = require('./notes.model');

const create = async (req, res, next) => {
    try {
        await model.create(req.body, req._user.employee_id);
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
        return res.status(200).json(result.rows)
    } catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getOne = async (req, res, next) => {
    try{
        const result = await model.getOne(req.id);
        if (result.rows.length === 0) {
            const error = new Error('This Note doesn\'t exist');
            error.statusCode = 400;
            throw error;
        }
        return res.status(200).json(result.rows[0]);
    } catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getEmployeeNotes = async (req, res, next) => {
    const employeeId = req.params.id;
    try {
        const result = await model.getEmployeeNotes(employeeId);
        return res.status(200).json(result.rows);
    } catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next (err);
    }
};

const update = async (req, res, next) => {
    const id = req.params.id;
    try {
        const result = await model.getOne(id);
        if(result.rows.length === 0) {
            const error = new Error('This notes doesn\'t exist');
            error.statusCode = 400;
            throw error;
        }
        await model.update(id, req.body);
        return res.status(200).json({message: 'updated'});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err);
    }
};

const del = async (req, res, next) => {
    const id = req.params.id;
    try {
        const result = await model.getOne(id);
        if (result.rows.length === 0){
            const error = new Error ('This notes doesn\'t exist');
            err.statusCode = 400;
            throw error;
        }
        await model.delete(id, req._user.employee_id);
        return res.status(200).json({message: 'deleted'});
    } catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500
        }
        next(err);
    }
};

exports.create = create;
exports.getAll = getAll;
exports.getOne = getOne;
exports.getEmployeeNotes = getEmployeeNotes;
exports.update = update;
exports.del = del;