var express = require('express');
var router = express.Router();
var stats_prefsController = require('../controllers/stats_prefs');
var authMiddleware = require('../middelware/authMiddleware');

router.use(authMiddleware);


router.post('/', stats_prefsController.create);

router.get('/', stats_prefsController.get);

router.get('/user/param/:usertype', stats_prefsController.getParamChart);
router.get('/user/find/charts/profile', stats_prefsController.getByUser);

router.put('/', stats_prefsController.update);

router.delete('/', stats_prefsController.del);

router.get('/axis', stats_prefsController.getAxis);

module.exports = router;
