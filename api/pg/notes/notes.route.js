const express = require('express');
const router = express.Router();
const note = require('./notes.controller');
const authMiddleware = require('../../../middelware/authMiddleware');

router.use(authMiddleware);

router.post('/', note.create);
router.get('/', note.getAll);
router.get('/employee/:id', note.getEmployeeNotes);
router.get('/:id', note.getOne);
router.put('/:id', note.update);
router.delete('/:id', note.del);

module.exports = router;