const express = require("express");
const router = express.Router();
const controller = require('./controller');
const authMiddleware = require("../../middelware/authMiddleware");

router.use(authMiddleware);

/**
 * controller not used, pgController used
 * consumed in FE contravention service, OSES
 * OSES GET /api/contravention?cn_number_offline=19070513374599991116
 * FE   GET /api/contravention?from=X&to=X&project_id=X
 */
router.get('/', controller.getAll);
/**
 * consumed in FE contravention service
 * GET /api/contravention/status-codes
 */
// test is needed
router.get('/status-codes', controller.getStatusCodes);
router.get('/observation-history', controller.observationsHistory);
router.get('/cn-history', controller.cnHistory);
router.get('/history', controller.getContraventionsByUser);
router.get('/by-plate/:carPlate/:plateCountry/:plateType', controller.getContraventionByPlate);
router.get('/by-reference/:reference', controller.getContraventionByReference);
router.get('/only-observations/:project_id/:creator_id', controller.getObservationsByCreatorID);
router.post('/', controller.create);
router.post('/verify', controller.verify);

/**
 * controller not used, pgController used
 * consumed in OSES
 * PUT /api/contravention?cn_number_offline=19070513374599991116
 * PUT /api/contravention?reference=5008383&status=0
 */
router.put('/cancel-observation/:cnNumberOffline', controller.cancelObservation);
router.put('/transform-observation/:cnNumberOffline', controller.transformObservation);

//----------- From PG/contraventions ---------------------
router.get('/by-cn-number-offline/:cn_number_offline', controller.getContraventionByCnNumberOffline);
router.put('/by-cn-number-offline/:cn_number_offline', controller.updateByCNNumberOffline);
router.put('/by-reference/:reference/:status', controller.updateByReference);

// Update contravention
router.put('/:cn_number', controller.updateByCnNumber);

module.exports = router;
