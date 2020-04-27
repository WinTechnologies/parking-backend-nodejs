var express = require('express');
var router = express.Router();
var project_activity = require('./project_activity.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', project_activity.create);

router.get('/', project_activity.getAll);

router.put('/:id', project_activity.update);

router.delete('/:id', project_activity.del);

module.exports = router;
