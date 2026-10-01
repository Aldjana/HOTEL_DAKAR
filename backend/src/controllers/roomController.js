const service = require('../services/roomService');
const audit = require('../services/auditService');
const response = require('../utils/response');
const h = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const log = (req, room, action, description) => audit.log(req, { entity_type: 'room', entity_id: room._id || req.params.id, action, description });

module.exports = {
  getAllRooms: h(async (req, res) => {
    const r = await service.getAllRooms(req.query);
    response.paginated(res, r.rooms, r, 'Chambres récupérées');
  }),
  getRoomById: h(async (req, res) => response.success(res, await service.getRoomById(req.params.id))),
  createRoom: h(async (req, res) => {
    const room = await service.createRoom(req.body);
    log(req, room, 'create', `Création de la chambre ${room.room_number}`);
    response.created(res, room, 'Chambre créée avec succès');
  }),
  updateRoom: h(async (req, res) => {
    const room = await service.updateRoom(req.params.id, req.body);
    log(req, room, 'update', `Modification de la chambre ${room.room_number}`);
    response.success(res, room, 'Chambre mise à jour');
  }),
  updateRoomStatus: h(async (req, res) => {
    if (req.user.role === 'housekeeping' && !['clean', 'cleaning', 'maintenance'].includes(req.body.status)) {
      throw AppError.forbidden('Le personnel de ménage peut uniquement marquer une chambre à nettoyer, propre ou en maintenance');
    }
    const room = await service.updateRoomStatus(req.params.id, req.body.status);
    log(req, room, 'status_change', `Chambre ${room.room_number} : statut → ${req.body.status}`);
    response.success(res, room, room.warning || 'Statut de la chambre mis à jour');
  }),
  setActive: h(async (req, res) => {
    const room = await service.setActive(req.params.id, req.body.is_active);
    log(req, room, 'update', `Chambre ${room.room_number} ${room.is_active ? 'activée' : 'désactivée'}`);
    response.success(res, room, room.is_active ? 'Chambre activée' : 'Chambre désactivée');
  }),
  deleteRoom: h(async (req, res) => {
    const r = await service.deleteRoom(req.params.id);
    log(req, { _id: req.params.id }, 'delete', `Suppression de la chambre ${r.room_number}`);
    response.success(res, null, r.message);
  }),
  getAvailableRooms: h(async (req, res) => response.success(res, await service.getAvailableRooms(req.query))),
  getRoomStatistics: h(async (req, res) => response.success(res, await service.getRoomStatistics())),
  getRoomsByStatus: h(async (req, res) => response.success(res, await service.getRoomsByStatus(req.query.status))),
  getRoomsByType: h(async (req, res) => response.success(res, await service.getRoomsByType(req.query.room_type_id))),
};
