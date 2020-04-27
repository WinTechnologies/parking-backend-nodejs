var express = require('express');
var router = express.Router();
var control = require('./tariff-service.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', control.create);

router.get('/', control.getAll);

router.put('/:id', control.update);

router.delete('/:id', control.del);

module.exports = router;
