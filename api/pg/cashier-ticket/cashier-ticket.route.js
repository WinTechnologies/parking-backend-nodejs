const express = require('express');
const router = express.Router();
const controller = require('./cashier-ticket.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.get);
router.post('/', controller.create);

module.exports = router;
