const express = require("express");
const router = express.Router();
const controller = require('./controller');
const authMiddleware = require("../../../middelware/authMiddleware");

router.use(authMiddleware);
router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:token_name', controller.update);
module.exports = router;
