const express = require('express');
const router = express.Router();
const jobController = require('./job.controller');
const authMiddleware = require('../../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/', jobController.getJobs);
router.get('/pictures/:job_number', jobController.getPictures);
router.get('/by-reference/:reference', jobController.getJobsByReference);
router.get('/current', jobController.getCurrentJob);

router.get('/by-employee/:employee_id', jobController.getJobByEmployee);
router.get('/by-job-number/:job_number', jobController.getJobByNumber);
router.get('/by-cn-number-offline/:cn_number_offline', jobController.getJobByCnNumberOffline);
router.get('/by-cn-number/:cn_number', jobController.getJobByCnNumber);
router.get('/by-car-plate/:car_plate/:job_type', jobController.getJobByCarPlate);
router.get('/by-unpaid/:car_plate', jobController.getUnpaidJob);
router.get('/by-clamped-status/:car_plate', jobController.getJobByClampedStatus);
router.get('/by-declamp-status/:job_type/:project_id', jobController.getJobByDeClampStatus);
router.get('/by-barcode/:bar_code', jobController.getJobByBarcode);
router.get('/:id', jobController.getOne);

// Consumed by OSES to move OSES jobs to MAPS
router.post('/', jobController.create);

router.put('/', jobController.update);
// Start CLAMP, CLAMP TO TOW, TOW, DECLAMP JOB
router.put('/start/:job_number', jobController.start);
// Re-open CLAMP, CLAMP TO TOW, TOW, DECLMAP JOB
router.put('/reopen/:job_number', jobController.reopen);
// Complete CLAMP, CLAMP TO TOW, TOW, DECLAMP JOB
router.put('/complete/:job_number', jobController.complete);
// Deliver TOW JOB
router.put('/deliver/:job_number', jobController.deliverTowJob);
// Finish CLAMP, CLAMP TO TOW, TOW, DECLAMP JOB for escaped(MISSED) car
router.put('/missed/:job_number', jobController.finishEscapeCarJob);

router.put('/:job_number', jobController.updateByJobNumber);

//router.get('/observations/:username', jobController.getObs);
router.put('/pictures/clamp/:job_number', jobController.updateClampPicturesByJobNumber);
router.put('/pictures/declamp/:job_number', jobController.updateDeclampPicturesByJobNumber);
router.put('/pictures/tow/:job_number', jobController.updateTowPicturesByJobNumber);
router.put('/pictures/defect/:job_number', jobController.updateDefectPicturesByJobNumber);
router.put('/clamp-barcode/:job_number', jobController.updateClampBarCode);
module.exports = router;
