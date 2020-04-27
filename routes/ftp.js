var express = require('express');
var router = express.Router();
var controller = require('../controllers/ftp');
var authMiddleware = require('../middelware/authMiddleware');

router.use(authMiddleware);
router.get('/download-image-as-base64', controller.downloadImageAsBase64);
router.post('/upload-image', controller.uploadImage);
router.post('/replace-image', controller.replaceImage);
module.exports = router;
