const express = require('express');
const router = express.Router();
const models = require('./list_type_note.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', models.create);

router.get('/', models.getAll);

router.get('/no-enforcement-type', models.getWithNoEnforcementType);

router.get('/:id', models.getOne);

router.put('/:id', models.update);

router.delete('/:id', models.del);

module.exports = router;
