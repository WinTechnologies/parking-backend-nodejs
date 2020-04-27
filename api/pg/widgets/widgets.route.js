const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middelware/authMiddleware');

const onStreetController = require('./on-street-widget/on-street-widget.controller');
const enforcementController = require('./enforcement-widget/enforcement-widget.controller');
const carparkController = require('./car-park-widget/car-park-widget.controller');
const widgetsController = require('./widgets.controller');

router.use(authMiddleware);

router.get('/', widgetsController.get);

router.get('/enforcement', enforcementController.get);

router.get('/on-street', onStreetController.get);

router.get('/carpark', carparkController.get);

module.exports = router;