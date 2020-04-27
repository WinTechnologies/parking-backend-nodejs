const model = require('./act_enforcement_prediction.model');

const create = async (req, res, next) => {

    model.create(req.body).then(result => {
        return res.status(201).json({
            message: `Prediction for the ${result.rows[0].job_position} is created successully.`, 
            id: result.rows[0].id,
            project_id: result.rows[0].project_id,
            job_position: result.rows[0].job_position,
        });
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const getAll = async (req, res, next) => {
    model.getAll(req.query).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const get = async (req, res, next) => {
    const project_id = req.params.id;
    if(project_id) {
        return model.getAll({project_id: project_id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.get(project_id).then(results => {
                    return res.status(200).json(results.rows);
                });
            } else if (!result.rowCount) {
                return res.status(200).json([]);
            } else {
                return res.status(400).json({error: 'Invalid data.'});
            }
        });
    }
};

const update = async (req, res, next) => {
    const id = req.params.id;
    return model.getAll({id: id}).then(result => {
        if (result && result.rows && result.rows[0]) {
            return model.update(id, req.body).then(Updated => {
                return res.status(200).json({
                    message: `Prediction for the ${result.rows[0].job_position} is updated successully.`, 
                    id: parseInt(id),
                    project_id: result.rows[0].project_id,
                    job_position: result.rows[0].job_position,
                });
            });
        }
        else
            return res.status(202).json({error: 'Invalid data.'});
    });
};

const del = async (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({id: id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.delete(id).then(deleted => {
                    return res.status(200).json({
                        message: `Prediction for the ${result.rows[0].job_position} is deleted successully.`,
                        id: parseInt(id),
                        project_id: result.rows[0].project_id,
                        job_position: result.rows[0].job_position
                    });
                });
            } else return res.status(400).json({error: 'Invalid data.'});
        });
    }
};


exports.create = create;
exports.getAll = getAll;
exports.get = get;
exports.update = update;
exports.del = del;