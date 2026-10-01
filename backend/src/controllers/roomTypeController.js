const roomTypeService = require('../services/roomTypeService');
const response = require('../utils/response');

const roomTypeController = {
  async createRoomType(req, res, next) {
    try {
      const roomType = await roomTypeService.createRoomType(req.body);
      response.created(res, roomType, 'Type de chambre créé avec succès');
    } catch (error) {
      next(error);
    }
  },

  async getAllRoomTypes(req, res, next) {
    try {
      const result = await roomTypeService.getAllRoomTypes(req.query);
      response.paginated(res, result.roomTypes, result, 'Types de chambres récupérés avec succès');
    } catch (error) {
      next(error);
    }
  },

  async getRoomTypeById(req, res, next) {
    try {
      const roomType = await roomTypeService.getRoomTypeById(req.params.id);
      response.success(res, roomType);
    } catch (error) {
      next(error);
    }
  },

  async updateRoomType(req, res, next) {
    try {
      const roomType = await roomTypeService.updateRoomType(req.params.id, req.body);
      response.success(res, roomType, 'Type de chambre mis à jour avec succès');
    } catch (error) {
      next(error);
    }
  },

  async deleteRoomType(req, res, next) {
    try {
      await roomTypeService.deleteRoomType(req.params.id);
      response.success(res, null, 'Type de chambre supprimé avec succès');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = roomTypeController;
