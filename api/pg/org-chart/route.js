var express = require("express");
var router = express.Router();
var controller = require("./controller");
var authMiddleware = require("../../../middelware/authMiddleware");

router.use(authMiddleware);

router.get('/', controller.get);
router.post('/', controller.add);
router.delete('/', controller.del);

module.exports = router;