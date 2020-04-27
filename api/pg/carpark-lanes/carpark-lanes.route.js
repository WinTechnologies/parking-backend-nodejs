var express = require('express');
var router = express.Router();
var control = require('./carpark-lanes.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', control.create);

router.get('/', control.getAll);

router.get('/by-project/:projectId', control.getAllByProject);

router.get('/by-gate/:gateId', control.getAllByGate);

router.put('/:id', control.update);

router.delete('/:id', control.del);

module.exports = router;
