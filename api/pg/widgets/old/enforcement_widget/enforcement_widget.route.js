const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../middelware/pgAuthMiddleware');

const controller = require('./enforcement_widget.controller');

//router.use(authMiddleware);

router.get('/', controller.get);

module.exports = router;