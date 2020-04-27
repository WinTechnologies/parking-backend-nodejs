const model = require('./groups.model');
const groupViolationModel = require('../group-violation/group-violation.model');

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
            return res.status(201).json({ message: 'created.' })
        })
        .catch(err => {
            return res.status(400).json({ message: err.message });
        });
    }
};

const edit = async (req, res, next) => {
    try {
        const id = req.params.id;
        const responseGet = await model.get({id});
        if (responseGet.rows.length === 0) {
            return res.status(404).json({ message: 'This Group doesn\'t exist' });
        }
        await model.edit(req.body, id);
        return res.status(200).json({ message: 'updated.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const del = async (req, res, next) => {
    try {
        const id = req.params.id;
        const responseGet = await model.get({id});
        if (responseGet.rows.length === 0) {
            const error = new Error('This Group doesn\'t exist');
            error.statusCode = 404;
            throw error;
        }
        const deleted_by = req._user.employee_id;
        await model.del(id, deleted_by);
        await groupViolationModel.delByQuery({group_id: id}, deleted_by);
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

const getZonesList = async (req, res, next) => {
    try {
        const result = await model.getZonesList(req.query);
        return res.status(200).json(result);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getAssignmentsByGroup = async (req, res, next) => {
    try {
        const result = await model.getAssignmentsByGroup(req.query);
        return res.status(200).json(result.rows);
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
exports.getZonesList = getZonesList;
exports.getAssignmentsByGroup = getAssignmentsByGroup;
