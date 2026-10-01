const express = require('express');
const router = express.Router();
const c = require('../controllers/housekeepingController');
const { auth, requirePermission } = require('../middleware');

const read = [auth, requirePermission('housekeeping.read')];
const write = [auth, requirePermission('housekeeping.write')];
const manage = [auth, requirePermission('rooms.manage')];

router.post('/', ...write, c.createTask);
router.get('/', ...read, c.getAllTasks);
router.get('/by-date', ...read, c.getTasksByDate);
router.get('/statistics', ...read, c.getTaskStatistics);
router.get('/staff', ...read, c.getStaff);
router.get('/:id', ...read, c.getTaskById);
router.put('/:id', ...write, c.updateTask);
router.post('/:id/start', ...write, c.startTask);
router.post('/:id/complete', ...write, c.completeTask);
router.post('/:id/assign', ...manage, c.assignTask);
router.delete('/:id', ...manage, c.deleteTask);

module.exports = router;
