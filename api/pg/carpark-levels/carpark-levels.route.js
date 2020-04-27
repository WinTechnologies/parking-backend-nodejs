const express = require('express');
const router = express.Router();
const controllers = require('./carpark-levels.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', controllers.create);

// router.get('/', controllers.getAll);

router.get('/by-project/:projectId', controllers.getAllByProject);

// router.get('/by-zone/:zoneId', controllers.getAllByProjectZone);

// router.get('/by-terminal/:terminalId', controllers.getAllByTerminal);

router.get('/by-carpark/:carparkId', controllers.getAllByCarpark);

/* Get next terminal code from max value */
router.get('/level-code', controllers.getLevelCode);

// router.get('/:id', controllers.getOne);

router.put('/:id', controllers.update);

router.delete('/:id', controllers.del);

module.exports = router;
