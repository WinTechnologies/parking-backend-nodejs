var express = require('express');
var router = express.Router();
var act_enforcement_incentive_band = require('./act_enforcement_incentive_band.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', act_enforcement_incentive_band.create);

router.get('/', act_enforcement_incentive_band.getAll);

router.get('/:incentive_id', act_enforcement_incentive_band.get);

router.put('/:id', act_enforcement_incentive_band.update);

router.delete('/:id', act_enforcement_incentive_band.del);

router.delete('/incentive/:id', act_enforcement_incentive_band.deleteByIncentive);

module.exports = router;

