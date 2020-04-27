const model = require('./project_employee.model');

const assignEmployee = async (req, res, next) => {
    try {
        const assignerId = req._user.employee_id;
        await model.create(req.body, assignerId);
        return res.status(201).json({ message: 'created.' });
    } catch (err) {
        next(err);
    }
};

const assignEmployees = async (req, res, next) => {
    try {
        const assignerId = req._user.employee_id;
        if (Array.isArray(req.body.employees)) {
            await model.createBulk(req.body.employees, req.body.project_id, assignerId);
        } else {
            await model.createBulk([req.body.employees], req.body.project_id, assignerId);
        }
        return res.status(201).json({
            message: 'Employees\' assigned successfully'
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getEmployeesWithProject = async (req, res, next) => {
    try {
        const result = await model.getEmployeesWithProject(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
};

const getProjectEmployee = async (req, res, next) => {
    try {
        const result = await model.getProjectEmployee();
        return res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
};

const getEmployeeAssignedProjects = async (req, res, next) => {
    try {
        const employeeId = req.params.employee_id;
        const result = await model.getEmployeeAssignedProjects(employeeId);
        return res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
};

const update = (req, res, next) => {
    const id = req.params.id;
    if (id) {
        return model.getEmployeesWithProject({ id: id }).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.update(id, req.body).then(Updated => {
                    return res.status(202).json({ message: 'updated.' });
                });
            } else return res.status(202).json({ error: 'Invalid data.' });
        });
    }
};

const unassignEmployee = async (req, res, next) => {
   try {
       const id = req.params.id;
       await model.unassignEmployee(id);
       return res.status(200).json({ message: 'deleted.' });
   } catch (err) {
       next(err);
   }
};

exports.assignEmployee = assignEmployee;
exports.assignEmployees = assignEmployees;
exports.getEmployeesWithProject = getEmployeesWithProject;
exports.getProjectEmployee = getProjectEmployee;
exports.getEmployeeAssignedProjects = getEmployeeAssignedProjects;
exports.update = update;
exports.unassignEmployee = unassignEmployee;
