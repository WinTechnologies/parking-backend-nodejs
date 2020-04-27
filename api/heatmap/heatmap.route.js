const express = require('express');
const router = express.Router();
const heatmapController = require('./heatmap.controller');
const authMiddleware = require('../../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/', heatmapController.get);

module.exports = router;
