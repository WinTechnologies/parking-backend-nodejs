const express = require('express');
const router = express.Router();
const controller = require('./violation.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);
// Tariff/Enforcement Violation
router.get('/', controller.get);
router.post('/', controller.add);
router.put('/:id', controller.edit);
router.delete('/:id', controller.del);

module.exports = router;
