const express = require('express');
const router = express.Router();
const controllers = require('./carparks.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', controllers.create);

router.get('/', controllers.getAll);

router.get('/map', controllers.getAllCarparks);

/* Get next terminal code from max value */
router.get('/parking-code', controllers.getParkingCode);

/* Get all carpark types */
router.get('/carpark-types', controllers.getAllCarparkTypes);

router.get('/by-project/:projectId', controllers.getAllByProject);

router.get('/by-zone/:zoneId', controllers.getAllByProjectZone);

router.get('/by-terminal/:terminalId', controllers.getAllByTerminal);

router.get('/:id', controllers.getOne);

router.put('/:id', controllers.update);

router.delete('/:id', controllers.del);

module.exports = router;
