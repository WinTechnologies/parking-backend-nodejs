const express = require('express');
const router = express.Router();
const controller = require('./fleet_data.controller');

router.get('/', controller.get);

module.exports = router;
