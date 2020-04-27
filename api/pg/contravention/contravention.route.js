const express = require("express");
const router = express.Router();
const controller = require('./contravention.controller');

const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', controller.create);

/**
 * consumed in FE contravention service, OSES
 * GET /api/pg/contravention?cn_number_offline=19070513374599991116
 * GET /api/pg/contravention?from=X&to=X&project_id=X
 */
router.get('/', controller.getAll);

/**
 * consumed in FE contravention service
 * GET /api/pg/contravention/status-codes
 */
router.get('/status-codes', controller.getStatusCodes);

router.get('/:cn_number_offline', controller.getOne);

router.put('/:cn_number_offline', controller.updateByCNNumberOffline);

/**
 * consumed in OSES
 * PUT /api/pg/contravention?cn_number_offline=19070513374599991116
 * PUT /api/pg/contravention?reference=5008383&status=0
 */
router.put('/', controller.update);

module.exports = router;
