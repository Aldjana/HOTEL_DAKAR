const express = require('express');
const router = express.Router();
const historyLogController = require('../controllers/historyLogController');
const { auth, requirePermission, authorize } = require('../middleware');

router.use(auth, requirePermission('audit.read'));
router.get('/', historyLogController.getAllHistoryLogs);
router.get('/entity/:entityType/:entityId', historyLogController.getLogsByEntity);
router.get('/user/:userId', historyLogController.getLogsByUser);
router.get('/:id', historyLogController.getHistoryLogById);
// Le journal est conservé : pas de création manuelle, suppression réservée à l'admin.
router.delete('/:id', authorize('admin'), historyLogController.deleteHistoryLog);

module.exports = router;
