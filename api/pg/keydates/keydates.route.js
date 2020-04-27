var express = require('express');
var router = express.Router();
var keydates = require('./keydates.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', keydates.create);

router.get('/', keydates.getAll);

router.put('/:id', keydates.update);

router.delete('/:id', keydates.del);

router.get('/check', keydates.check);
module.exports = router;
