const express = require('express');
const router = express.Router();
const workplans = require('./workplans.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', workplans.create);

router.get('/', workplans.getAll);
router.get('/employee/:employee_id', workplans.getEmployeeWorkplan);

router.put('/reoccurings/:workplan_id', workplans.updateReoccurings);
router.put('/exceptions/:workplan_id', workplans.updateExceptions);
router.put('/employee-reoccurings/:employee_id', workplans.updateEmployeeReoccurings);
router.put('/employee-exceptions/:employee_id', workplans.updateEmployeeExceptions);
router.put('/:wp_name', workplans.update);


router.delete('/:wp_name', workplans.del);

module.exports = router;
