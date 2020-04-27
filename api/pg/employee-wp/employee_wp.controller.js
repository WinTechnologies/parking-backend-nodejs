const model = require('./employee_wp.model');

const create = async (req, res, next) => {
    const createdBy = req._user.employee_id;
    model.create(req.body, createdBy).then(result => {
        return res.status(201).json({message: 'created.'});
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const getAll = (req, res, next) => {
    model.getAll(req.query).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const getEmployees = (req, res, next) => {
    model.getEmployees(req.query).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const update = async (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({id: id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.update(id, req.body).then(Updated => {
                    return res.status(200).json({message: 'updated.'});
                });
            } else return res.status(202).json({error: 'Invalid data.'});
        });
    }
};

const del = async (req, res, next) => {
    const workplan_id = req.params.workplan_id;
    if(workplan_id) {
        return model.getAll({workplan_id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.delete(workplan_id).then(deleted => {
                    return res.status(200).json({message: 'deleted.'});
                });
            } else {
                return res.status(202).json({error: 'no employees'});
            }
        });
    }
};

const delByEmployeeId = async (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({employee_id: id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.deleteByEmployeeId(id).then(deleted => {
                    return res.status(200).json({message: 'deleted.'});
                });
            } else return res.status(202).json({error: 'Invalid data.'});
        });
    }
};


const getUnassignedEmployees = (req, res, next) => {
    model.getUnassignedEmployees(req.query).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

exports.create = create;
exports.getAll = getAll;
exports.getEmployees = getEmployees;
exports.update = update;
exports.del = del;
exports.delByEmployeeId = delByEmployeeId;
exports.getUnassignedEmployees = getUnassignedEmployees;
