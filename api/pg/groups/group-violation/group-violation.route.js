const express = require('express');
const router = express.Router();
const models = require('./group-violation.controller');
const authMiddleware = require('../../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', models.create);

router.get('/', models.getAll);

router.get('/details', models.getAllDetails);

router.get('/:id', models.getOne);

router.put('/:id', models.update);

router.delete('/:id', models.del);

module.exports = router;
