const model = require('./violation.model');
const groupViolationModel = require('../groups/group-violation/group-violation.model');

const get = async (req, res, next) => {
    try {
        const result = await model.get(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
};

const add = async (req, res, next) => {
    if (req.body) {
        model.add(req.body, req._user.employee_id).then(result => {
            return res.status(201).json({message: 'created.'})
        })
        .catch(err => {
            return res.status(400).json({ message: err.message });
        });
    }
};

const edit = async (req, res, next) => {
    try {
        const id = req.params.id;
        await model.edit(req.body, id);
        return res.status(200).json({message: 'updated.'})
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const del = async (req, res, next) => {
    try {
        const deleted_by = req._user.employee_id;
        const violation_id = req.params.id;
        await model.del(violation_id, deleted_by);
        await groupViolationModel.delByQuery({violation_id}, deleted_by);
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

exports.get = get;
exports.add = add;
exports.edit = edit;
exports.del = del;
