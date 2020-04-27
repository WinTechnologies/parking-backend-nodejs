const express = require('express');
const router = express.Router();
const controller = require('./permission-types.controller');
const authMiddleware = require('../../../../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.getAll);

module.exports = router;
