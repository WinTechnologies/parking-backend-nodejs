const express = require('express');
const router = express.Router();
const controller = require('./default-values.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/:type', controller.create);

router.get('/:type', controller.getAll);

router.get('/:type/:id', controller.getOne);

router.put('/:type/:id', controller.update);

router.delete('/:type/:id', controller.del);

module.exports = router;
