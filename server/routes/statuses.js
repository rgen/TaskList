const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/statusesController');

router.get('/', ctrl.getAll);
router.post('/', ctrl.createStatus);
router.delete('/:id', ctrl.deleteStatus);

module.exports = router;
