var express = require('express');
var router = express.Router();
var serviceController = require('./controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/', serviceController.getServices);
router.get('/by-project/:project_id', serviceController.getServices);
router.get('/by-project-type/:project_id/:operation_type', serviceController.getServices);
router.get('/by-id/:id', serviceController.getServices);
router.get('/by-code/:code', serviceController.getServices);
router.post('/', serviceController.create);
module.exports = router;
