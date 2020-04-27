const express = require('express');
const router = express.Router();
const control = require('./escalations.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', control.create);

// Tariff/Enforcement Escalation
router.get('/', control.getAll);

router.put('/:id', control.update);

router.delete('/:id', control.del);

module.exports = router;
