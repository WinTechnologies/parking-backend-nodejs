const express = require('express');
const router = express.Router();
const controller = require('./job.controller');

const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.getAll);

router.get('/:job_number', controller.getOne);

router.put('/:job_number', controller.updateByJobNumber);

router.put('/', controller.update);

// router.delete('/:job_number', controller.del);

router.get('/:car_plate/:job_type', controller.getOneByCarPlate);

router.put('/spot_declamp/:job_number', controller.onSpotDeclamp);

module.exports = router;
