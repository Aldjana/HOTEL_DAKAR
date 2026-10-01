const express = require('express');
const router = express.Router();
const c = require('../controllers/dashboardController');
const { auth, requirePermission } = require('../middleware');

router.get('/statistics', auth, requirePermission('dashboard.read'), c.getDashboardStatistics);
router.get('/availability-calendar', auth, requirePermission('planning.read'), c.getAvailabilityCalendar);

module.exports = router;
