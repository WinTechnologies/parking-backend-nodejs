const express = require('express');
const router = express.Router();
const controller = require('./vehicle-plate-type.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.getAll);
router.get('/issued-countries', controller.getIssuedCountries);
module.exports = router;
