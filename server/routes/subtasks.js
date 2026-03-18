const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/subtasksController');

router.get('/', ctrl.getSubtasks);
router.post('/', ctrl.createSubtask);
router.put('/:id', ctrl.updateSubtask);
router.delete('/:id', ctrl.deleteSubtask);

module.exports = router;
