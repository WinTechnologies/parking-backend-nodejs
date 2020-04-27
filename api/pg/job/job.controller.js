const model = require('./job.model');
const vatModel = require("../../pg/vat/vat.model");
const cnService = require("../../contravention/service");
const MQTTPublisher = require('../../services/MQTT/publisher');
const { JobStatus, MqttSubject } = require('../../../api/contravention/constants');

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

const getOne = async (req, res, next) => {
    try {
        const job_number = +req.params.job_numbeggr;
        const response = await model.getOne(job_number);
        if (response.rows.length === 0) {
            const error = new Error('Could not find Job');
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json(response.rows[0]);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getOneByCarPlate = async (req, res, next) => {

    try {
        const car_plate = req.params.car_plate;
        const job_type = req.params.job_type;
        const response = await model.getOneByCarPlate(car_plate, job_type);
        if (response.rows.length === 0) {
            const error = new Error('Could not find Job');
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json(response.rows[0]);
    }catch (e) {
        return res.status(400).json({message : e.toString()});
    }
};

const updateByJobNumber = async (req, res, next) => {
    try {
        const job_number = +req.params.job_number;
        const response = await model.getOne(job_number);
        if (response.rows.length === 0) {
            const error = new Error('Could not find Job');
            error.statusCode = 404;
            throw error;
        }
        await model.update({job_number}, req.body);
        return res.status(200).json({
            message: 'Job updated'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const response = await model.getAll(req.query);
        if (response.rows.length === 0) {
            const error = new Error('Could not find Job');
            error.statusCode = 404;
            throw error;
        }
        await model.update(req.query, req.body);
        return res.status(200).json({
            message: 'Job updated'
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
        const job_number = +req.params.job_number;
        const response = await model.getOne(job_number);
        if (response.rows.length === 0) {
            const error = new Error('Could not find Job');
            error.statusCode = 404;
            throw error;
        }
        await model.delete(job_number);
        return res.status(200).json({
            message: 'Deleted Job'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const onSpotDeClamp = async (req, res, next) => {

    try {
        const job_number = req.query.job_number;
        const job_status = JobStatus.types['DECLAMP JOB'].paid;
        const response = await model.onSpotDeClamp(job_number, job_status);
        MQTTPublisher.client.publish(MqttSubject.UpdatedJob, JSON.stringify(response.rows[0]));
        return res.status(200).json({message: "updated"});

    }catch (e) {
       return res.status(400).json({message: e.toString()});
    }
};

exports.getAll = getAll;
exports.getOne = getOne;
exports.getOneByCarPlate = getOneByCarPlate;
exports.update = update;
exports.updateByJobNumber = updateByJobNumber;
exports.del = del;
exports.onSpotDeclamp = onSpotDeClamp;
