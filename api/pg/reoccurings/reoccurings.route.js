const express = require('express');
const router = express.Router();
const controller = require('./reoccurings.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', controller.create);

router.get('/', controller.getAll);

router.put('/:id', controller.update);

router.delete('/:id', controller.del);

router.delete('/wp/:id', controller.delByWP);

module.exports = router;
