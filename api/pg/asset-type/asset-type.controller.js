const model = require('./asset-type.model');

const create = async (req, res, next) => {
    try {
        await model.create(req.body);
        return res.status(201).json({
            message: 'created.'
        });
    } catch (err) {
        if (err.detail && err.detail.indexOf('(code)') > -1) {
            return res.status(500).json({ message: 'The Type Code you enter has already existed, please choose another Code' });
        } else {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        }
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await model.getAll(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getCategoryAsset = async (req, res, next) => {
    try {
        const response = await model.getCategoryAsset();
        if(response.rows.length === 0) {
            const error = new Error('There is no category asset');
            error.statusCode = 404;
            throw error;
        }
        const result = response.rows.map(res => res);
        return res.status(200).json(result);
    } catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500
        }
        next (err);
    }
};

const getOne = async (req, res, next) => {
    try {
        const result = await model.getOne(req.params.id);
        if(result.rows.length === 0) {
            const error = new Error('This Asset Type doesn\'t exist');
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};


const update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const responseGetAll = await model.getAll({id: id});
        if (responseGetAll.rows.length === 0) {
            const error = new Error('This Asset Tyoe doesn\'t exist');
            error.statusCode = 404;
            throw error;
        }
        await model.update(id, req.body);
        return res.status(202).json({message: 'updated.'});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const del = async (req, res, next) => {
    try {
        const id = req.params.id;
        if (id) {
            const responseGetAll = await model.getAll({id: id});
            if (responseGetAll.rows.length === 0) {
                const error = new Error('This Asset Type doesn\'t exist');
                error.statusCode = 404;
                throw error;
            }
            await model.delete(id);
            return res.status(202).json({
                message: 'deleted.'
            });
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.create = create;
exports.getAll = getAll;
exports.getOne = getOne;
exports.getCategoryAsset = getCategoryAsset;
exports.update = update;
exports.del = del;