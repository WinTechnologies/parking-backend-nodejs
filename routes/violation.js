const express = require('express');
const router = express.Router();
const violationController = require('../controllers/violation');
const authMiddleware = require('../middelware/authMiddleware');

router.use(authMiddleware);

// For mobile and OSES
router.post('/', violationController.create);
router.get('/', violationController.get);

router.get('/by-project/:projectId/:datetime?', violationController.getAssignmentListByProject);
router.get('/details-by-code/:projectCode/:violationCode/:datetime?', violationController.getAssignedViolationDetail);
router.get('/details-by-assignment/:projectId/:assignmentId', violationController.getSelectedAssignmentDetail);

router.put('/', violationController.update);
router.delete('/', violationController.del);
router.delete('/project', violationController.deleteByProject);

module.exports = router;
