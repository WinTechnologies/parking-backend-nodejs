const model = require('./contravention.model');
const MQTTPublisher = require('../../services/MQTT/publisher');
const createdContravention = 'CreatedContravention';

const create = async (req, res, next) => {
    try {
        await model.create(req.body);
        MQTTPublisher.client.publish(createdContravention, { message: 'Contravention created successfully'});
        return res.status(201).json({
            message: 'Contravention created successfully'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await  model.getAll(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

/**
 * Used in api/contravention/route.js - /api/contravention
 *      in api/pg/contravention/contravention.route.js - /api/pg/contravention -- will be deprecated.
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getStatusCodes = async (req, res, next) => {
    try {
        const result = await  model.getStatusCodes();
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getOne = async (req, res, next) => {
    try {
        const cn_number_offline = req.params.cn_number_offline;
        const response = await model.getOne(cn_number_offline);
        if (response.rows.length === 0) {
            return res.status(404).json({
                message: 'Could not find Contravention'
            });
        }
        return res.status(200).json(response.rows[0]);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const updateByCNNumberOffline = async (req, res, next) => {
    try {
        const cn_number_offline = req.params.cn_number_offline;
        const response = await model.getOne(cn_number_offline);
        if (response.rows.length === 0) {
            return res.status(404).json({
                message: 'Could not find Contravention'
            });
        }
        await model.update({cn_number_offline}, req.body);
        return res.status(200).json({
            message: 'Contravention updated'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

/**
 * Used in api/contravention/route.js - /api/contravention
 *      in api/pg/contravention/contravention.route.js - /api/pg/contravention -- will be deprecated.
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const update = async (req, res, next) => {
    try {
        const response = await model.getAll(req.query);
        if (response.rows.length === 0) {
            return res.status(404).json({
                message: 'Could not find Contravention'
            });
        }
        await model.update(req.query, req.body);
        return res.status(200).json({
            message: 'Contravention updated'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const del = async (req, res, next) => {
    try {
        const cn_number_offline = req.params.cn_number_offline;
        const response = await model.getOne(cn_number_offline);
        if (response.rows.length === 0) {
            return res.status(404).json({
                message: 'Could not find Contravention'
            });
        }
        await model.delete(cn_number_offline);
        return res.status(200).json({
            message: 'Deleted Contravention'
        });
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
exports.update = update;
exports.updateByCNNumberOffline = updateByCNNumberOffline;
exports.del = del;
exports.getStatusCodes = getStatusCodes;