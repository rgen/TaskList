const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tasksController');
const { createAttachment, deleteAttachment } = require('../controllers/subtasksController');

router.get('/', ctrl.getAll);
router.post('/', ctrl.createTask);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.updateTask);
router.patch('/:id/toggle', ctrl.toggleTask);
router.delete('/:id', ctrl.deleteTask);

// Attachments
router.post('/:taskId/attachments', createAttachment);
router.delete('/:taskId/attachments/:id', deleteAttachment);

module.exports = router;
