const express = require('express');
const router = express.Router();
const models = require('./list_city.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', models.create);

router.get('/', models.getAll);

router.get('/with-projects', models.getAllWithProjects);

router.get('/:city_code', models.getOne);

router.put('/:city_code', models.update);

router.delete('/:city_code', models.del);

module.exports = router;
