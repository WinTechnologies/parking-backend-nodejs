const express = require('express');
const router = express.Router();
const employee_wp = require('./employee_wp.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', employee_wp.create);

router.get('/', employee_wp.getAll);

router.get('/employees', employee_wp.getEmployees);

router.get('/unassigned-employees', employee_wp.getUnassignedEmployees);

router.put('/:id', employee_wp.update);

router.delete('/:workplan_id', employee_wp.del);

router.delete('/employee/:id', employee_wp.delByEmployeeId);

module.exports = router;
