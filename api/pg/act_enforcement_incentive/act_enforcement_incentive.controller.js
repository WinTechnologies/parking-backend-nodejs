const model = require('./act_enforcement_incentive.model');

const create = async (req, res, next) => {
    const project_id = req.body.project_id;
    const job_position = req.body.job_position;
    const incentive_category = req.body.incentive_category;
    const incentive_name = req.body.incentive_name;
    if(project_id && job_position && incentive_category && incentive_name) {
        return model.get(project_id).then(result => {
            if (result && result.rows && result.rows[0]) {
                for(i=0; i < result.rows.length; i++)
                {
                    if (result.rows[i].incentive_name === incentive_name &&
                        result.rows[i].incentive_category === incentive_category &&
                        result.rows[i].job_position === job_position) {
                            return res.status(400).json({message: 'this incentive already exists'});
                    }
                }
            }
            model.create(req.body).then(result => {
                console.log(result.rows[0].id); // TODO GET THE ID OF CREATED
                return res.status(201).json({
                    message: `Incentive for the ${job_position} is created successully.`, 
                    id : result.rows[0].id,
                    project_id: project_id,
                    job_position: result.rows[0].job_position
                });
            }).catch(err => {
                return res.status(400).json({message: err.message});
            });
        })
    }
    else
        return res.status(400).json({error: 'Invalid data.'});

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
                return res.status(400).json({error: 'No data.'});
            }
        }).catch(err => {
            return res.status(400).json({message: err.message});
        });
    }
};

const update = async (req, res, next) => {
    const id = req.params.id;
    const project_id = req.body.project_id;
    const job_position = req.body.job_position;
    const incentive_category = req.body.incentive_category;
    const incentive_name = req.body.incentive_name;
    if(id && project_id && job_position && incentive_category && incentive_name) {
        return model.get(project_id).then(result => {
            if (result && result.rows && result.rows[0]) {
                for (i = 0; i < result.rows.length; i++) {
                    if (result.rows[i].incentive_name === incentive_name &&
                        result.rows[i].incentive_category === incentive_category &&
                        result.rows[i].job_position === job_position &&
                        +result.rows[i].id !== +id) {
                        return res.status(400).json({message: 'this name is already used'});
                    }
                }
            }
            return model.update(id, req.body).then(Updated => {
                return res.status(200).json({
                    message: `Incentive for the ${result.rows[0].job_position} is updated successully.`, 
                    id: parseInt(id), 
                    project_id: project_id,
                    job_position: result.rows[0].job_position
                });
            });
        });
    }
    else
        return res.status(400).json({error: 'Invalid data.'});
};

const del = async (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({id: id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.delete(id).then(deleted => {
                    return res.status(200).json({
                        message: `Incentive for the ${result.rows[0].job_position} is deleted successully.`, 
                        id: parseInt(id),
                        project_id: project_id,
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