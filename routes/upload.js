var express = require('express');
var router = express.Router();
var uploadController = require('../controllers/upload');
var authMiddleware = require('../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/', uploadController.getUploaded);
router.post('/many/:app/:section/:sub?', uploadController.uploadMany);
router.post('/one/:app/:section/:sub?', uploadController.uploadOne);
router.post('/replace/:originalFile', uploadController.replaceImage);
module.exports = router;