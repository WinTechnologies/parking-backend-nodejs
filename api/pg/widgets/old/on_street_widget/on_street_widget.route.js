const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../middelware/pgAuthMiddleware');

const controller = require('./on_street_widget.controller');

//router.use(authMiddleware);

router.get('/', controller.get);

module.exports = router;