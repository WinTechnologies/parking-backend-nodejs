var express = require('express');
var router = express.Router();
var control = require('./project-terminal.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', control.create);

/* Get next terminal code from max value */
router.get('/terminal-code', control.getTerminalCode);

router.get('/airport', control.getAirports);

router.get('/', control.getAll);

router.get('/by-project/:projectId', control.getAllByProject);

router.get('/by-zone/:zoneId', control.getAllByProjectZone);

router.put('/:id', control.update);

router.delete('/:id', control.del);

module.exports = router;
