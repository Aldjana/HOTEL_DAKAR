const express = require('express');
const router = express.Router();
const roomTypeController = require('../controllers/roomTypeController');
const { auth, authorize } = require('../middleware');

// Admin and Manager can manage room types, Reception can view
router.post('/', auth, authorize('admin', 'manager'), roomTypeController.createRoomType);
router.get('/', auth, authorize('admin', 'manager', 'reception', 'housekeeping'), roomTypeController.getAllRoomTypes);
router.get('/:id', auth, authorize('admin', 'manager', 'reception', 'housekeeping'), roomTypeController.getRoomTypeById);
router.put('/:id', auth, authorize('admin', 'manager'), roomTypeController.updateRoomType);
router.delete('/:id', auth, authorize('admin'), roomTypeController.deleteRoomType);

module.exports = router;
