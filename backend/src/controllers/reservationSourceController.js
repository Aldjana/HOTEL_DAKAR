const reservationSourceService = require('../services/reservationSourceService');
const response = require('../utils/response');

const reservationSourceController = {
  async createReservationSource(req, res, next) {
    try {
      const reservationSource = await reservationSourceService.createReservationSource(req.body);
      response.created(res, reservationSource, 'Source de réservation créée avec succès');
    } catch (error) {
      next(error);
    }
  },

  async getAllReservationSources(req, res, next) {
    try {
      const result = await reservationSourceService.getAllReservationSources(req.query);
      response.paginated(res, result.reservationSources, result, 'Sources de réservation récupérées avec succès');
    } catch (error) {
      next(error);
    }
  },

  async getReservationSourceById(req, res, next) {
    try {
      const reservationSource = await reservationSourceService.getReservationSourceById(req.params.id);
      response.success(res, reservationSource);
    } catch (error) {
      next(error);
    }
  },

  async updateReservationSource(req, res, next) {
    try {
      const reservationSource = await reservationSourceService.updateReservationSource(req.params.id, req.body);
      response.success(res, reservationSource, 'Source de réservation mise à jour avec succès');
    } catch (error) {
      next(error);
    }
  },

  async deleteReservationSource(req, res, next) {
    try {
      await reservationSourceService.deleteReservationSource(req.params.id);
      response.success(res, null, 'Source de réservation supprimée avec succès');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = reservationSourceController;
