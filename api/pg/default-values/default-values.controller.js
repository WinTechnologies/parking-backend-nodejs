const incidentModel = require('./../sequelize-models').list_incident;
const vatModel = require('./../sequelize-models').vat;
const cityModel = require('./../sequelize-models').list_city;
const jobTypeModel = require('./../sequelize-models').list_type_job;

const positionModel = require('./../sequelize-models').list_position;
const departmentModel = require('./../sequelize-models').list_department;
const Op = require('./../sequelize-models').Sequelize.Op;
const MQTTpublisher = require("../../services/MQTT/publisher");

const RemovedDefaultValueSubject = 'RemovedDefaultValue';
const CreatedDefaultValueSubject = 'CreatedDefaultValue';
const UpdatedDefaultValueSubject = 'UpdatedDefaultValue';

const MODELS = {
    department: departmentModel,
    position: positionModel,
    job_type: jobTypeModel,
    city: cityModel,
    vat: vatModel,
    incident: incidentModel
};

const create = async (req, res, next) => {
    try {
        let creationInformation;
        switch(req.params.type) {
            case 'incident': {
                // available fields: id, code, name_en, name_ar, img_url, description, created_by, created_at
                const { code, name_en, name_ar, img_url, description, created_by } = req.body;
                creationInformation = {
                    code,
                    name_en,
                    name_ar,
                    img_url,
                    description,
                    created_by
                    // created_at: new Date(),
                };
                const check = await MODELS[req.params.type].findOne({
                    where: {
                        [Op.or]: {
                            code: creationInformation.code,
                            name_en: creationInformation.name_en,
                            name_ar: creationInformation.name_ar,
                        }
                    }
                }).dataValues;
                if (check && check.code && check.code === creationInformation.code) {
                    throw new Error('list_incident_code');
                } else if (check && check.name_en && check.name_en === creationInformation.name_en) {
                    throw new Error('list_incident_name');
                } else if (check && check.name_ar && check.name_ar === creationInformation.name_ar) {
                    throw new Error('list_incident_name_ar');
                }
                break;
            }
            case 'vat': {
                // available fields: id, vat_code, vat_percentage, vat_country, vat_name
                const { vat_code, vat_percentage, vat_country, vat_name } = req.body;
                creationInformation = {
                    vat_code,
                    vat_percentage,
                    vat_country,
                    vat_name
                };
                break;
            }
            case 'department': {
                // available fields: id, department_name, department_code
                const { department_name, department_code } = req.body;
                creationInformation = {
                    department_name,
                    department_code
                };
                break;
            }
            case 'position': {
                 // available fields: id, code, name, type_job_id, created_by, created_at
                const { code, name, type_job_id, created_by } = req.body;
                creationInformation = {
                    code,
                    name,
                    type_job_id,
                    created_by
                };
                break;
            }
            case 'job_type': {
                // available fields: id, code, name, created_by, created_at
                const { code,name, created_by } = req.body;
                creationInformation = {
                    code,
                    name,
                    created_by
                };
                break;
            }
            case 'city': {
                // available fields: id, city_code, city_name, city_code_pin
                const { city_code, city_name, city_code_pin } = req.body;
                creationInformation = {
                    city_code,
                    city_name,
                    city_code_pin
                };
                const check = await MODELS[req.params.type].findOne({
                    where: {
                        [Op.or]: {
                            city_code: creationInformation.city_code,
                            city_name: creationInformation.city_name,
                            city_code_pin: creationInformation.city_code_pin,
                        }
                    }
                }).dataValues;
                if (check && check.city_code && check.city_code === creationInformation.city_code) {
                    throw new Error('city_code');
                } else if (check && check.city_name && check.city_name === creationInformation.city_name) {
                    throw new Error('city_name');
                } else if (check && check.city_code_pin && check.city_code_pin === creationInformation.city_code_pin) {
                    throw new Error('city_code_pin');
                }
                break;
            }
            default:
                throw new Error('parameter error');
        }
        const result = (await MODELS[req.params.type].create(creationInformation));
        result.dataValues.apiEndpoint = req.params.type;
        MQTTpublisher.client.publish(
            CreatedDefaultValueSubject,
            JSON.stringify(result.dataValues)
        );
        return res.status(201).json({
            message: 'Code created successfully',
            id: result.dataValues.id
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        if (err.errors[0].message.indexOf('city_code_pin') > -1) {
            return res.status(400).json({
                message: 'The Code PIN you enter exists already, please choose another Code PIN'
            });
        } else if (err.errors[0].message.indexOf('code') > -1) {
            return res.status(400).json({
                message: 'The Code you enter has already existed, please choose another Code'
            });
        } else if (err.errors[0].message.indexOf('name_en') > -1 || err.errors[0].message.indexOf('city_name') > -1) {
            return res.status(400).json({
                message: 'The Name you enter exists already, please choose another Name'
            });
        } else if (err.errors[0].message.indexOf('name_ar') > -1) {
            return res.status(400).json({
                message: 'The Name in Arabic you enter exists already, please choose another Name in Arabic'
            });
        }
        next(err);
    }
};

const getAll = async (req, res, next) => {
    try {
        switch(req.params.type) {
            case 'position': {
                const result = (await positionModel.findAll({
                    include:[{
                        model: jobTypeModel,
                        as: 'list_type_job',
                        required: true
                    }]
                })).map(row => {
                    const rowData = row.dataValues;
                    const listTypeJobData = row.dataValues.list_type_job.dataValues;
                    delete rowData.list_type_job;
                    rowData['type_job_name'] = listTypeJobData.name;
                    return rowData;
                });
                return res.status(200).json(result);
            }
            default: {
                const result = (await MODELS[req.params.type].findAll()).map(row => row.dataValues);
                return res.status(200).json(result);
            }
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getOne = async (req, res, next) => {
    try {
        const id = +req.params.id;
        const result = (await MODELS[req.params.type].findOne({
            where: { id: id }
        }));
        if (!result) {
            const error = new Error('Could not find Code');
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json(result);

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        let updateInformation;
        const id = +req.params.id;
        switch(req.params.type) {
            case 'incident': {
                // fields: id, code, name_en, name_ar, img_url, description, created_by, created_at
                const { code, name_en, name_ar, img_url, description, created_by } = req.body;
                updateInformation = {
                    code,
                    name_en,
                    name_ar,
                    img_url,
                    description,
                    created_by
                };
                break;
            }
            case 'vat': {
                //model fields: id,vat_code,vat_percentage,vat_country,vat_name
                const { vat_code, vat_percentage, vat_country, vat_name } = req.body;
                updateInformation = {
                    vat_code,
                    vat_percentage,
                    vat_country,
                    vat_name
                };
                break;
            }
            case 'department': {
                // available fields: id,department_name,department_code
                const { department_name, department_code } = req.body;
                updateInformation = {
                    department_name,
                    department_code
                };
                break;
            }
            case 'position': {
                 // available fields: id,code,name,type_job_id,created_by,created_at
                const { code, name, type_job_id, created_by } = req.body;
                updateInformation = {
                    code,
                    name,
                    type_job_id,
                    created_by
                };
                break;
            }
            case 'job_type': {
                // available fields: id, code, name, created_by, created_at
                const { code, name, created_by } = req.body;
                updateInformation = {
                    code,
                    name,
                    created_by
                };
                break;
            }
            case 'city': {
                // available fields: id, city_code, city_name, city_code_pin
                const { city_code, city_name, city_code_pin } = req.body;
                updateInformation = {
                    city_code,
                    city_name,
                    city_code_pin
                };
                break;
            }
            default:
                throw new Error('parameter error');
        }
        const check = await MODELS[req.params.type].findOne({
            where: { id: id }
        });
        if (!check) {
            const error = new Error('Could not find Code');
            error.statusCode = 404;
            throw error;
        }
        const result = await MODELS[req.params.type].update(
            updateInformation, {
            where: { id: id }
        });
        updateInformation.id = id;
        updateInformation.apiEndpoint = req.params.type;
        MQTTpublisher.client.publish(UpdatedDefaultValueSubject, JSON.stringify(updateInformation));
        return res.status(200).json({
            message: 'Code updated successfully',
            id: id
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
        const id = +req.params.id;
        const result = await MODELS[req.params.type].destroy({
            where: { id: id }
        });
        MQTTpublisher.client.publish(
            RemovedDefaultValueSubject,
            JSON.stringify({ id: id, apiEndpoint: req.params.type })
        );
        return res.status(200).json({ message: 'Deleted Code' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// RESTful apis
exports.create = create;
exports.getAll = getAll;
exports.getOne = getOne;
exports.update = update;
exports.del = del;
