const express = require('express');
const router = express.Router();
const c = require('../controllers/cashController');
const { auth, requirePermission } = require('../middleware');

router.get('/daily', auth, requirePermission('cash.read'), c.getDaily);
router.get('/cashiers', auth, requirePermission('cash.read'), c.cashiers);
router.get('/closures', auth, requirePermission('cash.read'), c.listClosures);
router.post('/close', auth, requirePermission('cash.close'), c.close);
router.delete('/closures/:date', auth, requirePermission('cash.close'), c.reopen);

module.exports = router;
