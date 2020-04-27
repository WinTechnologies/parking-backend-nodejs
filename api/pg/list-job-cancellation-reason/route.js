const express = require('express');
const router = express.Router();
const control = require('./controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/', control.getAll);
router.get('/:code', control.getByCode);
router.get('/by-job-action-code/:job_action_code', control.getByJobActionCode)
router.post('/', control.create);
router.put('/:code', control.update);

module.exports = router;