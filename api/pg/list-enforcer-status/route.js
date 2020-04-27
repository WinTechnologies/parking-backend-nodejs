var express = require('express');
var router = express.Router();
var controller = require('./controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);
router.get('/', controller.getAllListEnforcerStatus);
router.post('/', controller.create);
router.get('/by-type-job-id/:type_job_id', controller.getEnforcerStatusByTypeJobId)
module.exports = router;
