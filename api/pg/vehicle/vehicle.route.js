const express = require('express');
const router = express.Router();
const vehicleController = require('./vehicle.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);
router.get('/colors', vehicleController.getAllColors);
router.get('/makes', vehicleController.getAllMakes);
router.get('/models', vehicleController.getAllModels);
router.get('/types', vehicleController.getAllTypes);
router.get('/plate-types', vehicleController.getAllPlateTypes);

module.exports = router;