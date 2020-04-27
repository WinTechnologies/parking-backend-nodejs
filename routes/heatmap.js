var express = require('express');
var router = express.Router();
var heatmapController = require('../controllers/heatmap');
var authMiddleware = require('../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/', heatmapController.get);
router.get('/uniquedates', heatmapController.getUniqueDates);
router.get('/predictivedates', heatmapController.getPredictiveDates);
router.get('/predictive', heatmapController.getPredictive);

module.exports = router;
