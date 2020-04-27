var express = require('express');
var router = express.Router();
var control = require('./project_openland.controller');
var authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', control.create);

router.get('/', control.getAll);

router.get('/land-code', control.getLandCode);

router.get('/zones', control.getAllByZone);

router.put('/:id', control.update);

router.delete('/:id', control.del);

module.exports = router;
