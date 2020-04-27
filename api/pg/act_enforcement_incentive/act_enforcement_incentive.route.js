var express = require('express');
var router = express.Router();
var act_enforcement_incentive = require('./act_enforcement_incentive.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', act_enforcement_incentive.create);

router.get('/', act_enforcement_incentive.getAll);

router.get('/:id', act_enforcement_incentive.get);

router.put('/:id', act_enforcement_incentive.update);

router.delete('/:id', act_enforcement_incentive.del);

module.exports = router;

