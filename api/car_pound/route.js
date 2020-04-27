var express = require("express");
var router = express.Router();
var controller = require('./controller');
var authMiddleware = require("../../middelware/authMiddleware");


router.use(authMiddleware);

router.get('/', controller.get);

module.exports = router;
