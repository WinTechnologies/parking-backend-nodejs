var express = require('express');
var router = express.Router();
var jobController = require('../../controllers/mobile/jobs');

router.post('/', jobController.create);
router.post('/start', jobController.start);
router.post('/cancel', jobController.cancel);
router.post('/complete', jobController.complete);
router.get('/history', jobController.history);
router.get('/', jobController.get);
router.get('/towjobs', jobController.getTowJobs);
router.get('/clamper', jobController.getClamperJobs);
router.get('/isavailable', jobController.isAgentAvailable);
router.get('/current', jobController.currentJob);

module.exports = router;
