var express = require('express');
var router = express.Router();
var control = require('./carpark-assets.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.put('/install/:id', control.create);

router.get('/:type', control.getAll);

router.get('/by-project/:type/:projectId', control.getAllInstalledByProject);

router.get('/by-carparkZone/:type/:carparkZoneId', control.getAllInstalledByCarparkZone);

router.put('/:id', control.update);

router.delete('/:id', control.del);

module.exports = router;
