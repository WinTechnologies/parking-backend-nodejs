const express = require('express');
const router = express.Router();
const controller = require('./analytics.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

// Chart
router.post('/chart', controller.addChart);
router.put('/chart/:id', controller.updateChart);
router.delete('/chart/:id', controller.delChart);

// New Analytics Module APIs
// Library Group
router.get('/group', controller.getLibraryGroups);
router.get('/employee', controller.getAllEmployees);
router.post('/group', controller.createLibraryGroups);
router.put('/group/:id', controller.updateLibraryGroups);
router.delete('/group/:id', controller.deleteLibraryGroups);
router.delete('/group/member/:employee_id/:group_id', controller.removeGroupMember);

// Dashboards (Reports)
router.get('/report/all', controller.getAllReports);
router.get('/report/by_project/:id', controller.getReportsByProject);
router.get('/report/public', controller.getPublicReports);
router.get('/report/mine', controller.getEmployeeReports);
router.get('/report/group', controller.getGroupReports);
router.get('/report/:id', controller.getReportDetail);
router.put('/report/share-to-all/:id', controller.shareReportToAll);
router.put('/report/to-private/:id', controller.privateReport);
router.put('/report/share-to-group/:report_id/:group_id', controller.shareReportToGroup);
router.put('/report/fork/:id', controller.duplicateReport);
router.post('/report', controller.addReport);
module.exports = router;
