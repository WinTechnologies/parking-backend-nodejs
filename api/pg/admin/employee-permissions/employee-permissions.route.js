const express = require('express');
const router = express.Router();
const controller = require('./employee-permissions.controller');
const authMiddleware = require('../../../../middelware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.getAll);
router.get('/with-template', controller.getAllWithTemplate);
router.get('/with-template/:employee_id', controller.getOneWithTemplate);
router.get('/assigned-employees/:permission_template_id', controller.getAssignedEmployees);
router.get('/by-permission', controller.getEmployeesByPermissions);

router.post('/', controller.create);
router.post('/create-bulk', controller.createBulk);
router.post('/update-bulk', controller.updateBulk);
router.post('/delete-bulk', controller.delBulk);

router.get('/:employee_id', controller.getOne);

router.put('/:employee_id', controller.update);

router.delete('/:employee_id', controller.del);

module.exports = router;
