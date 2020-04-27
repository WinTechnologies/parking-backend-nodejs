const express = require('express');
const router = express.Router();
const assets = require('./assets.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', assets.create);

router.get('/', assets.getAll);

router.get('/zones', assets.getAllByZones);

router.get('/stats', assets.getStats);

router.get('/available', assets.getAvailable);

router.get('/devices', assets.getDevices);

router.get('/models', assets.getModels);

router.get('/:id', assets.getOne);

router.put('/:id', assets.update);

router.delete('/:id', assets.del);

module.exports = router;
