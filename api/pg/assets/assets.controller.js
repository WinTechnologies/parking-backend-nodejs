const model = require('./assets.model');
const modelAssetModel = require('../assets-models/assets-models.model');

const create = async (req, res, next) => {
    model.create(req.body).then(result => {
        return res.status(201).json({message: 'created.'});
    }).catch(err => {
        if (err.message.indexOf('asset_ip_address_uni_idx') > -1) {
            return res.status(400).json({
                message: 'This serial number already in used by an other asset of this model'
            });
        } else if (err.message.indexOf('asset_vehicle_plate_uni_en_idx') > -1) {
            return res.status(400).json({
                message: 'This Car Plate Number exists already and is in used by an other asset'
            });
        } else if (err.message.indexOf('asset_vehicle_plate_uni_ar_idx') > -1) {
            return res.status(400).json({
                message: 'This Car Plate Number exists already and is in used by an other asset'
            });
        } else {
            return res.status(400).json({message: err.message});
        }
    });
};

const getStats = (req, res, next) => {
    model.getStats(req.query).then(result => {
        result = result.map( v => {
            return v.rows[0].count;
        })
        return res.status(200).json(result);
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

const getAllByZones = (req, res, next) => {
    model.getAllByZones(req.query).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const getOne = (req, res, next) => {
    model.getAll({id: req.params.id}).then(result => {
        let asset = (result.rows && result.rows[0]) ? result.rows[0]: {};
            return res.status(200).json(asset);
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const getModels = (req, res, next) => {
    model.getModels(req.query).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const getAvailable = async (req, res, next) => {
    try {
        const result = await model.getAvailable(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getDevices = async (req, res, next) => {
    try {
        let devicesType = await modelAssetModel.getAll({category_asset: 'Device'});
        if(devicesType.rows.length === 0) {
            const error = new Error('This Project Asset doesn\'t exist');
            error.statusCode = 404;
            throw error;
        }
        devicesType = devicesType.rows.map(device => device.type_asset);
        const result = await model.getDevices(req.query, [...new Set(devicesType)]);
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const update = (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({codification_id: id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.update(id, req.body).then(UpdatedAsset => {
                    return res.status(200).json({message: 'success.'});
                });
            } else return res.status(404).json({error: 'Asset ID doesn\'t exist'});
        });
    } else {
        return res.status(400).json({error: 'Asset ID is missing!'});
    }
};

const del = async (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({codification_id: id}).then(result => {
            if (result && result.rows && result.rows[0]) {
            return model.delete(id).then(deletedAsset => {
                return res.status(202).json({message: 'success.'});
        }, reject => {
            return res.status(500).json({
                message: reject.detail
            });
        });
        } else return res.status(202).json({error: 'Invalid assets data.'});
    });
    }
};


exports.create = create;
exports.getAll = getAll;
exports.getAllByZones = getAllByZones;
exports.getStats = getStats;
exports.getOne = getOne;
exports.getModels = getModels;
exports.getAvailable = getAvailable;
exports.getDevices = getDevices;
exports.update = update;
exports.del = del;
