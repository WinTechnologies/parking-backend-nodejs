var express = require('express');
var router = express.Router();
var logMetaController = require('./controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', logMetaController.create);

module.exports = router;
