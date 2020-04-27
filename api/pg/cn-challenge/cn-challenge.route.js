const express = require('express');
const router = express.Router();

const controller = require('./cn-challenge.controller.js');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

/* Router */
router.get('/', controller.getAll);
router.get('/:id', controller.getCnChallengeById);
router.post('/', controller.add);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

router.put('/validate/:id', controller.validate);
router.put('/reject/:id', controller.reject);

module.exports = router;
