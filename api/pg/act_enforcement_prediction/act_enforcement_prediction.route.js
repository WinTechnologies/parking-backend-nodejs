var express = require('express');
var router = express.Router();
var act_enforcement_prediction = require('./act_enforcement_prediction.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', act_enforcement_prediction.create);

router.get('/', act_enforcement_prediction.getAll);

router.get('/:id', act_enforcement_prediction.get);

router.put('/:id', act_enforcement_prediction.update);

router.delete('/:id', act_enforcement_prediction.del);

module.exports = router;

