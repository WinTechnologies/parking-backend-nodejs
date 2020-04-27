const model = require('./employee-permissions.model');

const create = async (req, res, next) => {
    try {
        await model.create(req.body);
        return res.status(201).json({
            message: 'Employee permission created successfully'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const createBulk = async (req, res, next) => {
    try {
        if (Array.isArray(req.body.employees)) {
            await model.createBulk(req.body.employees, req.body.permission_template_id);
        } else {
            await model.create({employee_id: req.body.employees, permission_template_id: req.body.permission_template_id});
        }
        return res.status(201).json({
            message: 'Employees\' permission created successfully'
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

const getAllWithTemplate = async (req, res, next) => {
    try {
        const result = await  model.getAllWithTemplate(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getEmployeesByPermissions = async (req, res, next) => {
    try {
        const result = await  model.getEmployeesByPermissions(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const getAssignedEmployees = async (req, res, next) => {
    try {
        const permission_template_id = +req.params.permission_template_id;
        const result = await  model.getAssignedEmployees(permission_template_id);
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
        const response = await model.getOne(req.params.employee_id);
        if (response.rows.length === 0) {
            const error = new Error('Could not find Employee permission');
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

const getOneWithTemplate = async (req, res, next) => {
    try {
        const response = await model.getOneWithTemplate(req.params.employee_id);
        if (response.rows.length === 0) {
            const error = new Error('Could not find Employee permission');
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

const update = async (req, res, next) => {
    try {
        const responseGet = await model.getOne(req.params.employee_id);
        if (responseGet.rows.length === 0) {
            const error = new Error('Could not find Employee permission');
            error.statusCode = 404;
            throw error;
        }
        const responseUpdate = await model.update(req.params.employee_id, req.body);
        return res.status(200).json({
            message: 'Employee permission updated'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const updateBulk = async (req, res, next) => {
    try {
        if (Array.isArray(req.body.employees)) {
            await model.updateBulk(req.body.employees, req.body.permission_template_id);
        } else {
            await model.update(req.body.employees, req.body);
        }

        return res.status(200).json({
            message: 'Employees\'s permission updated'
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
        const responseGet = await model.getOne(req.params.employee_id);
        if (responseGet.rows.length === 0) {
            const error = new Error('Could not find Employee permission');
            error.statusCode = 404;
            throw error;
        }
        const responseDelete = await model.del(req.params.employee_id);
        return res.status(200).json({
            message: 'Deleted Employee permission'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const delBulk = async (req, res, next) => {
    try {
        if (Array.isArray(req.body.employees)) {
            await model.delBulk(req.body.employees);
        } else {
            await model.del(req.body.employees);
        }
        return res.status(200).json({
            message: 'Deleted Employees\' permission'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.create = create;
exports.createBulk = createBulk;
exports.getAll = getAll;
exports.getOne = getOne;
exports.update = update;
exports.updateBulk = updateBulk;
exports.del = del;
exports.delBulk = delBulk;

exports.getAllWithTemplate = getAllWithTemplate;
exports.getOneWithTemplate = getOneWithTemplate;
exports.getAssignedEmployees = getAssignedEmployees;
exports.getEmployeesByPermissions = getEmployeesByPermissions;