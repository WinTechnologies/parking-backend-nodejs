var express = require('express');
var router = express.Router();
var authController = require('./auth.controller');

/* Authenticate user */
router.post('/', authController.webAuth);
router.post('/m', authController.mobileAuth);
router.post('/token', authController.refreshAccessToken);
router.put('/resetPassword', authController.resetPassword);
router.put('/logout', authController.logout);
module.exports = router;
