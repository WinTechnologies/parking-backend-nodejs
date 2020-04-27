var express = require('express');
var router = express.Router();
var parkings = require('./parkings.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', parkings.create);

router.get('/', parkings.getAll);

router.get('/with-zone', parkings.getAllWithZones);

router.get('/details', parkings.getAllWithDetails);

router.put('/:id', parkings.update);

router.delete('/:id', parkings.del);

router.get('/number', parkings.getNumber);

router.get('/parking-code', parkings.getParkingCode);

router.get('/payment-method', parkings.getPaymentMethods);

module.exports = router;
