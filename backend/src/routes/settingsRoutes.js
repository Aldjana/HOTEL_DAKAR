const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth, requirePermission } = require('../middleware');

// Identité publique (écran de connexion) : nom et logo uniquement
router.get('/public', settingsController.getPublicInfo);

// Lecture : tout utilisateur connecté (identité de l'établissement affichée dans l'interface)
router.get('/hotel', auth, requirePermission('settings.read'), settingsController.getHotelSettings);
router.put('/hotel', auth, requirePermission('settings.update'), settingsController.updateHotelSettings);
router.get('/billing', auth, requirePermission('settings.read'), settingsController.getBillingSettings);
router.put('/billing', auth, requirePermission('settings.update'), settingsController.updateBillingSettings);
router.get('/reservation-sources', auth, requirePermission('settings.read'), settingsController.getReservationSources);
router.put('/reservation-sources', auth, requirePermission('settings.update'), settingsController.updateReservationSources);

module.exports = router;
