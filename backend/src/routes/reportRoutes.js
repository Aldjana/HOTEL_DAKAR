const express = require('express');
const router = express.Router();
const c = require('../controllers/reportController');
const { auth, requirePermission } = require('../middleware');

router.get('/planning', auth, requirePermission('planning.read'), c.planning);
router.get('/overview', auth, requirePermission('reports.read'), c.overview);
router.get('/occupancy', auth, requirePermission('reports.read'), c.occupancy);
router.get('/receivables', auth, requirePermission('reports.read'), c.receivables);
router.get('/usage', auth, requirePermission('reports.read'), c.usage);
router.get('/export/:type', auth, requirePermission('exports.read'), c.export);

module.exports = router;
