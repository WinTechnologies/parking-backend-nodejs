const express = require('express');
const router = express.Router();
const controllers = require('./carpark-zones.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', controllers.create);

router.get('/', controllers.getAll);

router.get('/by-level/:levelId', controllers.getAllByCarparkLevel);

router.get('/by-carpark/:carparkId', controllers.getAllByCarpark);

router.get('/by-project/:projectId', controllers.getAllByProject);

router.get('/:id', controllers.getOne);

router.put('/:id', controllers.update);

router.delete('/:id', controllers.del);

module.exports = router;
