var express = require('express');
var router = express.Router();
var grphhppr = require('./controller');

router.post('/', grphhppr.getRoute);

module.exports = router;