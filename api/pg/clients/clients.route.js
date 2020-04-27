var express = require('express');
var router = express.Router();
var clients = require('./clients.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', clients.create);

router.get('/', clients.getAll);

router.put('/:id', clients.update);

router.delete('/:id', clients.del);

module.exports = router;
