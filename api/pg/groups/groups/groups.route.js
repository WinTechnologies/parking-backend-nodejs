const express = require('express');
const router = express.Router();
const controller = require('./groups.controller');
const authMiddleware = require('../../../../middelware/authMiddleware');

router.use(authMiddleware);

// Tariff/Enforcement Groups
router.get('/', controller.get);

router.get('/zones', controller.getZonesList);

router.post('/', controller.add);

router.put('/:id', controller.edit);

router.delete('/:id', controller.del);

module.exports = router;
