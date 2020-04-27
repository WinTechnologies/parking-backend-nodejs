const express = require('express');
const router = express.Router();
const project_employee = require('./project_employee.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/', project_employee.getProjectEmployee);
router.get('/employees', project_employee.getEmployeesWithProject);
router.get('/projects/:employee_id', project_employee.getEmployeeAssignedProjects);

router.post('/', project_employee.assignEmployee);
router.post('/create-bulk', project_employee.assignEmployees);
router.put('/:id', project_employee.update);
router.delete('/:id', project_employee.unassignEmployee);

module.exports = router;
