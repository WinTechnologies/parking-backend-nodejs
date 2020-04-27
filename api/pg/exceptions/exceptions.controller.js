const model = require('./exceptions.model');

const create =  (req, res, next) => {
    model.create(req.body).then(result => {
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

const update =  (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.update(id, req.body).then(Updated => {
                    return res.status(202).json({message: 'updated.'});
                });
            } else return res.status(202).json({error: 'Invalid data.'});
        });
    }
};

const del =  (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({id}).then(result => {
            if (result && result.rows && result.rows[0]) {
            return model.delete(id).then(deleted => {
                return res.status(202).json({message: 'deleted.'});
        });
        } else return res.status(202).json({error: 'Invalid data.'});
    });
    }
};


const delByWP = async (req, res, next) => {
    const workplan_id = req.params.id;
    if (workplan_id) {
        try {
            const response = await model.getAll({workplan_id});
            if (response.rows.length === 0) {
                return res.status(202).json({error: 'no exceptions'});
            } else {
                return model.updateByWP(workplan_id, {
                    deleted_by: req._user.employee_id,
                    deleted_at: new Date().toISOString(),
                }).then(deletedWp => {
                    return res.status(200).json({message: 'deleted.'});
                }).catch(err => {
                    return res.status(500).json({message: err});
                });
            }
        } catch (err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err)
        }
    }
};



exports.create = create;
exports.getAll = getAll;
exports.update = update;
exports.del = del;
exports.delByWP = delByWP;
