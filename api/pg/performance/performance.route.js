const express = require('express');
const router = express.Router();
const employees = require('./performance.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/:employee_id', employees.getChartStatisticByEmployeeId);
router.get('/:employee_id/map', employees.getMapStatisticByEmployeeId);

module.exports = router;
