const paymentModeService = require('../services/paymentModeService');
const response = require('../utils/response');

const paymentModeController = {
  async createPaymentMode(req, res, next) {
    try {
      const paymentMode = await paymentModeService.createPaymentMode(req.body);
      response.created(res, paymentMode, 'Mode de paiement créé avec succès');
    } catch (error) {
      next(error);
    }
  },

  async getAllPaymentModes(req, res, next) {
    try {
      const result = await paymentModeService.getAllPaymentModes(req.query);
      response.paginated(res, result.paymentModes, result, 'Modes de paiement récupérés avec succès');
    } catch (error) {
      next(error);
    }
  },

  async getPaymentModeById(req, res, next) {
    try {
      const paymentMode = await paymentModeService.getPaymentModeById(req.params.id);
      response.success(res, paymentMode);
    } catch (error) {
      next(error);
    }
  },

  async updatePaymentMode(req, res, next) {
    try {
      const paymentMode = await paymentModeService.updatePaymentMode(req.params.id, req.body);
      response.success(res, paymentMode, 'Mode de paiement mis à jour avec succès');
    } catch (error) {
      next(error);
    }
  },

  async deletePaymentMode(req, res, next) {
    try {
      await paymentModeService.deletePaymentMode(req.params.id);
      response.success(res, null, 'Mode de paiement supprimé avec succès');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = paymentModeController;
