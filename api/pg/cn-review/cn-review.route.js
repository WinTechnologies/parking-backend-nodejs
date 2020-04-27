const express = require('express');
const router = express.Router();

const controller = require('./cn-review.controller.js');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);
/* Router */
router.get('/', controller.getAll);
router.get('/:id', controller.getCnReviewById);
router.post('/', controller.create);
router.put('/:id', controller.update);

router.put('/validate/:id', controller.validate);
router.put('/challenge/:id', controller.challenge);

module.exports = router;

