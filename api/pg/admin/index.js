const express = require('express');
const router = express.Router();

const permissionFeatures = require('./permission-features/permission-features.route');
const permissionTemplates = require('./permission-templates/permission-templates.route');
const permissionTypes = require('./permission-types/permission-types.route');
const employeePermissions = require('./employee-permissions/employee-permissions.route');

router.use('/permission-features', permissionFeatures);
router.use('/permission-templates', permissionTemplates);
router.use('/permission-types', permissionTypes);
router.use('/employee-permissions', employeePermissions);

module.exports = router;