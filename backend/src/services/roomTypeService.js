const RoomType = require('../models/RoomType');
const AppError = require('../utils/AppError');

const roomTypeService = {
  async getAllRoomTypes(query = {}) {
    const { page = 1, limit = 200, is_active } = query;
    
    const filter = {};
    if (is_active !== undefined) {
      filter.is_active = is_active === 'true';
    }
    
    const skip = (page - 1) * limit;
    
    const [roomTypes, total] = await Promise.all([
      RoomType.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      RoomType.countDocuments(filter),
    ]);
    
    return {
      roomTypes,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    };
  },

  async getRoomTypeById(id) {
    const roomType = await RoomType.findById(id);
    
    if (!roomType) {
      throw AppError.notFound('Type de chambre non trouvé');
    }
    
    return roomType;
  },

  async createRoomType(roomTypeData) {
    const roomType = await RoomType.create(roomTypeData);
    return roomType;
  },

  async updateRoomType(id, updateData) {
    const roomType = await RoomType.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!roomType) {
      throw AppError.notFound('Type de chambre non trouvé');
    }
    
    return roomType;
  },

  async deleteRoomType(id) {
    const doc = await RoomType.findById(id);
    if (!doc) {
      throw AppError.notFound('Type de chambre non trouvé');
    }
    const { Room } = require('../models');
    const used = await Room.countDocuments({ room_type_id: id });
    if (used > 0) throw AppError.conflict(`Ce type est utilisé par ${used} chambre(s) : désactivez-le à la place`);
    await RoomType.deleteOne({ _id: id });
    
    return { message: 'Type de chambre supprimé avec succès' };
  },
};

module.exports = roomTypeService;
