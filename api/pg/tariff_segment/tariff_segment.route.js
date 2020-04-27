const express = require('express');
const router = express.Router();
const control = require('./tariff_segment.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.post('/', authMiddleware, control.create);

router.get('/', authMiddleware, control.getAll);

router.get('/overview', authMiddleware, control.getOverview);

router.get('/calculate-price', control.calculatePrice);

router.put('/:id', authMiddleware, control.update);

router.delete('/:id', authMiddleware, control.del);

module.exports = router;
