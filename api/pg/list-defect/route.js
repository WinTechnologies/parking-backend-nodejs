const express = require('express');
const router = express.Router();
const control = require('./controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/', control.getAll);
router.get('/:id', control.getById);
router.post('/', control.create);
router.put('/:id', control.update);

module.exports = router;
