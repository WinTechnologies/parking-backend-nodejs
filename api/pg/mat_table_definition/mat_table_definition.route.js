const express = require('express');
const router = express.Router();
const controller = require('./mat_table_definition.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/:tableName', controller.get);

module.exports = router;
