var express = require('express');
var router = express.Router();
var control = require('./project_zone.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', control.create);

router.get('/', control.getAll);

router.get('/project', control.getAllByProject);

router.get('/with-project', control.getZonesByProjectID);

router.get('/with-parkings', control.getWithParkingsByProject);

router.get('/zone-code', control.getZoneCode);

router.put('/:id', control.update);

router.delete('/:id', control.del);

module.exports = router;
