const express = require('express');
const router = express.Router();
const control = require('./vehicle_make_controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/', control.getAll);

router.post('/', control.create);

router.put('/:id', control.update);

router.delete('/:id', control.del);

module.exports = router;
