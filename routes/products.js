var express = require('express');
var router = express.Router();
var controllerProducts = require('../controllers/products');
var authMiddleware = require('../middelware/authMiddleware');

router.use(authMiddleware);


//get, by query
router.get('/', controllerProducts.get);
router.get('/client_type', controllerProducts.getClientType);
router.get('/days', controllerProducts.getDays);
router.get('/interval_time', controllerProducts.getIntervalTime);
router.get('/interval_time_by_site_id', controllerProducts.getTimeIntervalsBySiteId);
router.get('/calendar_by_site_id', controllerProducts.getCalendarBySiteId);

//add, by body params
router.post('/', controllerProducts.create);
router.post('/interval_time', controllerProducts.createIntervalTime);

//update, by body params
router.put('/', controllerProducts.update);
router.put('/days', controllerProducts.updateDays);

//delete, by body params
router.delete('/', controllerProducts.del);
router.delete('/days', controllerProducts.delDays);
router.delete('/interval_time', controllerProducts.delIntervalTime);

module.exports = router;