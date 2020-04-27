const model = require('./group-violation.model');

const create = async (req, res, next) => {
    try {
        const created_by = req._user.employee_id;
        await model.create(req.body, created_by);
        return res.status(201).json({
            message: 'Group violation created!'
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await model.getAll(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

const getAllDetails = async (req, res, next) => {
    try {
        const result = await model.getAllDetails(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

const getOne = async (req, res, next) => {
    try {
        const group_violation_id = req.params.id;
        const result = await model.getOne(group_violation_id);
        if(result.rows.length === 0) {
            return res.status(404).json({
                message: 'This Group Violation doesn\'t exist'
            });
        }
        return res.status(200).json(result.rows[0]);
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

const update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const responseGet = await model.getOne(id);
        if (responseGet.rows.length === 0) {
            return res.status(404).json({
                message: 'This Group Violation doesn\'t exist'
            });
        }
        await model.update(id, req.body);
        return res.status(200).json({message: 'updated.'});
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

const del = async (req, res, next) => {
    try {
        const id = req.params.id;
        const responseGet = await model.getOne(id);
        if (responseGet.rows.length === 0) {
            return res.status(404).json({
                message: 'This Group Violation doesn\'t exist'
            });
        }
        await model.delete(id, req._user.employee_id);
        return res.status(200).json({
            message: 'deleted.'
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

exports.create = create;
exports.getAll = getAll;
exports.getAllDetails = getAllDetails;
exports.getOne = getOne;
exports.update = update;
exports.del = del;
