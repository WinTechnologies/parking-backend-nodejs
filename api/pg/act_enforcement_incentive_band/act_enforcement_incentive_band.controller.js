const model = require('./act_enforcement_incentive_band.model');

const create = async (req, res, next) => {
    model.create(req.body).then(result => {
        return res.status(201).json({message: 'created.'});
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
    const incentive_id = req.params.incentive_id;
        return model.get(incentive_id).then(result => {
            if (result && result.rows && result.rows[0]) {
                return res.status(202).json(result.rows);
            } else {
                return res.status(202).json([]);
            }
        }).catch(err => {
            return res.status(400).json({message: err.message});
        });
};

const update = async (req, res, next) => {
    const band_id = req.params.id;
    if(band_id) {
        return model.getAll({band_id: band_id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.update(band_id, req.body).then(Updated => {
                    return res.status(202).json({message: 'updated.'});
                });
            }
            else
                return res.status(404).json({error: 'Not Found'});
        });
    }
    else
        return res.status(400).json({error: 'Invalid data.'});
};

const del = async (req, res, next) => {
    const band_id = req.params.id;
    if(band_id) {
        return model.getAll({band_id: band_id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.delete(band_id).then(deleted => {
                    return res.status(202).json({message: 'deleted.'});
                });
            } else return res.status(400).json({error: 'Bands not found'});
        });
    }
};

const deleteByIncentive = async (req, res, next) => {
    const incentive_id = req.params.id;
    if(incentive_id) {
        return model.deleteByIncentive(incentive_id).then(deleted => {
            return res.status(202).json({message: 'Incentive bands deleted.'});
        });
    } else return res.status(400).json({error: 'Incentive bands not found'});


};





exports.create = create;
exports.getAll = getAll;
exports.get = get;
exports.update = update;
exports.del = del;
exports.deleteByIncentive = deleteByIncentive;