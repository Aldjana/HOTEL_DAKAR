const express = require('express');
const router = express.Router();
const c = require('../controllers/roomController');
const { auth, requirePermission } = require('../middleware');

const read = [auth, requirePermission('rooms.read')];
router.get('/', ...read, c.getAllRooms);
router.get('/available', ...read, c.getAvailableRooms);
router.get('/by-status', ...read, c.getRoomsByStatus);
router.get('/by-type', ...read, c.getRoomsByType);
router.get('/statistics', ...read, c.getRoomStatistics);
router.get('/:id', ...read, c.getRoomById);
router.post('/', auth, requirePermission('rooms.manage'), c.createRoom);
router.put('/:id', auth, requirePermission('rooms.manage'), c.updateRoom);
// Statut ménage : ménage et réception peuvent marquer « à nettoyer » / « propre »
router.patch('/:id/status', auth, requirePermission('housekeeping.write'), c.updateRoomStatus);
router.patch('/:id/active', auth, requirePermission('rooms.manage'), c.setActive);
router.delete('/:id', auth, requirePermission('rooms.manage'), c.deleteRoom);

module.exports = router;
