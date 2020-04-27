var express = require('express');
var router = express.Router();
var towVehicleController = require('./towVehicule.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);
router.get('/', towVehicleController.getByProject);
router.get('/:id', towVehicleController.getOne);

router.post('/assign',towVehicleController.assignTowVehicle);
router.post('/unassign',towVehicleController.unassignTowVehicle);

module.exports = router;