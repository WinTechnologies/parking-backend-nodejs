const model = require('./assets-models.model');

const create = (req, res, next) => {
    const type_id = req.body.type_id;
    if(type_id) {
        model.getAll({type_id: type_id}).then(result => {
            let modelCode = 1;
            if (result && result.rows && result.rows[0]) {
                const sortedArray = result.rows.sort((a, b) => +a.code > +b.code);
                modelCode = +sortedArray[sortedArray.length-1].code + 1;
            }
            model.create(req.body, modelCode).then(results => {
                return res.status(201).json({message: 'created.'});
            }).catch( err => {
                if (err.detail && err.detail.indexOf('(name)') > -1) {
                    return res.status(400).json({ message: 'The Name you enter exists already, please choose another Name' });
                } else {
                    return res.status(400).json({message: err.message});
                }
            });
        }).catch( err => {
            return res.status(400).json({message: err.message});
        });
    }
};

const getAll = (req, res, next) => {
    model.getAll(req.query).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const getAllWithCounts = (req, res, next) => {
    const { project_id, ...query } = req.query;
    model.getAllWithCounts(query, project_id).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const getCategoryAsset = async (req, res, next) => {
    try {
        const response = await model.getCategoryAsset();
        if(response.rows.length === 0) {
            const error = new Error('There is no category asset');
            error.statusCode = 404;
            throw error;
        }
        const result = response.rows.map(res => res.category_asset);
        return res.status(200).json(result);
    } catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500
        }
        next (err);
    }
};

const update = async (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({id: id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.update(id, req.body).then(Updated => {
                    return res.status(202).json({message: 'updated.'});
                });
            } else return res.status(202).json({error: 'Invalid data.'});
        });
    }
};

const del = async (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({id: id}).then(result => {
            if (result && result.rows && result.rows[0]) {
            return model.delete(id).then(deleted => {
                return res.status(202).json({message: 'deleted.'});
        });
        } else return res.status(202).json({error: 'Invalid data.'});
    });
    }
};

exports.create = create;
exports.getAll = getAll;
exports.getAllWithCounts = getAllWithCounts;
exports.getCategoryAsset = getCategoryAsset;
exports.update = update;
exports.del = del;
