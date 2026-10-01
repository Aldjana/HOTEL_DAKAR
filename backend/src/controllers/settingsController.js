const settingsService = require('../services/settingsService');
const response = require('../utils/response');
const audit = require('../services/auditService');

const settingsController = {
  async getPublicInfo(req, res, next) {
    try { response.success(res, await settingsService.getPublicInfo()); } catch (error) { next(error); }
  },
  async getHotelSettings(req, res, next) {
    try { response.success(res, await settingsService.getHotelSettings()); } catch (error) { next(error); }
  },
  async updateHotelSettings(req, res, next) {
    try { const r = await settingsService.updateHotelSettings(req.body); audit.log(req, { entity_type: 'settings', entity_id: r._id, action: 'update', description: "Mise à jour des paramètres de l'établissement" }); response.success(res, r, 'Paramètres mis à jour'); } catch (error) { next(error); }
  },
  async getBillingSettings(req, res, next) {
    try { response.success(res, await settingsService.getBillingSettings()); } catch (error) { next(error); }
  },
  async updateBillingSettings(req, res, next) {
    try { response.success(res, await settingsService.updateBillingSettings(req.body), 'Paramètres de facturation mis à jour'); } catch (error) { next(error); }
  },
  async getReservationSources(req, res, next) {
    try { response.success(res, await settingsService.getReservationSources()); } catch (error) { next(error); }
  },
  async updateReservationSources(req, res, next) {
    try { response.success(res, await settingsService.updateReservationSources(req.body.sources), 'Sources de réservation mises à jour'); } catch (error) { next(error); }
  },
};

module.exports = settingsController;
