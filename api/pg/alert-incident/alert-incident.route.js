const express = require('express');
const router = express.Router();
const controller = require('./alert-incident.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', controller.create);

router.get('/', controller.getAll);

router.get('/:id', controller.getOne);

router.put('/:id', controller.update);

router.delete('/:id', controller.del);

module.exports = router;