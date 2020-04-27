var express = require('express');
var router = express.Router();
var teamController = require('../controllers/team');
var authMiddleware = require('../middelware/authMiddleware');

router.use(authMiddleware);


router.post('/', teamController.create);

router.get('/', teamController.get);

router.put('/', teamController.update);

router.put('/bulk', teamController.updateBulk);

router.delete('/', teamController.del);

module.exports = router;
