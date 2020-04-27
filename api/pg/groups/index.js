const express = require('express');
const router = express.Router();

const group = require('./groups/groups.route');
const groupViolation = require('./group-violation/group-violation.route');

router.use('/', group);
router.use('/violation', groupViolation);

module.exports = router;