const express = require('express');
const router = express.Router();
const employees = require('./employees.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', employees.create);

router.get('/', employees.getAll);

router.get('/projects', employees.getWithProjects);

router.get('/departments', employees.getDepartments);

router.put('/modify-credentials', employees.modifyCredentails);

router.get('/positions/:department', employees.getPositions);

router.get('/count', employees.getCount);

router.get('/status', employees.getStatus);

router.get('/:employeeId', employees.getById);

router.put('/:employeeId', employees.updateByEmployeeId);

router.delete('/:id', employees.del);

module.exports = router;
