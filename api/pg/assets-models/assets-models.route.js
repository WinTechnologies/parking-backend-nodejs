var express = require('express');
var router = express.Router();
var models = require('./assets-models.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', models.create);

router.get('/', models.getAll);

router.get('/withCounts', models.getAllWithCounts);

router.get('/category-asset', models.getCategoryAsset);

router.put('/:id', models.update);

router.delete('/:id', models.del);

module.exports = router;
