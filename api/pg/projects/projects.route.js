const express = require('express');
const router = express.Router();
const projects = require('./projects.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', projects.create);

router.get('/', projects.getAllProjectsOfConnectedUser);
router.get('/with-activity', projects.getAllWithActivity);
router.get('/new-code', projects.getNextProjectCode);
// TODO: fix this API's reponse [{ "exists": true | false }] => { "exists": true | false }
router.get('/check-code', projects.checkCodeExists);
router.get('/:project_id', projects.getProjectById);

router.put('/:project_id', projects.update);
router.delete('/:project_id', projects.delete);

module.exports = router;
