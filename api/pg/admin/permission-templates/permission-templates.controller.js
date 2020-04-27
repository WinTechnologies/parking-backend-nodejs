const templateModel = require('./permission-templates.model');
const employeePermissionModel = require('../employee-permissions/employee-permissions.model');
const typeModel = require('../permission-types/permission-types.model');
const featureModel = require('../permission-features/permission-features.model');

const create = async (req, res, next) => {
    try {
        const features = await featureModel.getAll();
        await templateModel.create(req.body, features.rows);
        return res.status(201).json({
            message: 'Permission template created successfully'
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
        const result = await  templateModel.getAll(req.query);
        if (result.rows.length === 0) {
            return res.status(200).json(result.rows);
        }
        const promises = [
            typeModel.getAll(),
            featureModel.getAll()
        ];
        const [types, features] = await Promise.all(promises);
        const responseTemplates = [];
        result.rows.forEach(template => {
            const updatedTemplate = makeFeatureField(template, features.rows, types.rows);
            responseTemplates.push(updatedTemplate);
        });
        return res.status(200).json(responseTemplates);

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
        const response = await templateModel.getOne(id);
        if (response.rows.length === 0) {
            const error = new Error('Could not find Permission template');
            error.statusCode = 404;
            throw error;
        }

        const promises = [
            typeModel.getAll(),
            featureModel.getAll()
        ];
        const [types, features] = await Promise.all(promises);
        const updatedTemplate = makeFeatureField(response.rows[0], features.rows, types.rows);
        return res.status(200).json(updatedTemplate);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const makeFeatureField = (template, features, types) => {
    const resultTemplate = {
        id: template.id,
        template_name: template.template_name,
        template_desc: template.template_desc,
        date_created: template.date_created
    };
    features.forEach(feature => {
        resultTemplate[feature.feature] = types.find(type => type.permission_type === template[feature.feature]);
    });
    return resultTemplate;
};

const update = async (req, res, next) => {
    try {
        const id = +req.params.id;
        const responseGet = await templateModel.getOne(id);
        if (responseGet.rows.length === 0) {
            const error = new Error('Could not find Permission template');
            error.statusCode = 404;
            throw error;
        }
        const responseUpdate = await templateModel.update(id, req.body);
        return res.status(200).json({
            message: 'Permission template updated'
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
        const responseGet = await templateModel.getOne(id);
        if (responseGet.rows.length === 0) {
            const error = new Error('Could not find Permission template');
            error.statusCode = 404;
            throw error;
        }
        await templateModel.delete(id);
        await employeePermissionModel.delByTemplate(id);
        return res.status(200).json({
            message: 'Deleted Permission template'
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
exports.del = del;