const express = require('express');
const router = express.Router();
const exceptions = require('./exceptions.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', exceptions.create);

router.get('/', exceptions.getAll);

router.put('/:id', exceptions.update);

router.delete('/:id', exceptions.del);

router.delete('/wp/:id', exceptions.delByWP);

module.exports = router;
