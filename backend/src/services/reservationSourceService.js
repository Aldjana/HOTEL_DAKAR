const ReservationSource = require('../models/ReservationSource');
const AppError = require('../utils/AppError');

const reservationSourceService = {
  async getAllReservationSources(query = {}) {
    const { page = 1, limit = 200, is_active } = query;
    
    const filter = {};
    if (is_active !== undefined) {
      filter.is_active = is_active === 'true';
    }
    
    const skip = (page - 1) * limit;
    
    const [reservationSources, total] = await Promise.all([
      ReservationSource.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      ReservationSource.countDocuments(filter),
    ]);
    
    return {
      reservationSources,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    };
  },

  async getReservationSourceById(id) {
    const reservationSource = await ReservationSource.findById(id);
    
    if (!reservationSource) {
      throw AppError.notFound('Source de réservation non trouvée');
    }
    
    return reservationSource;
  },

  async createReservationSource(reservationSourceData) {
    const reservationSource = await ReservationSource.create(reservationSourceData);
    return reservationSource;
  },

  async updateReservationSource(id, updateData) {
    const reservationSource = await ReservationSource.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!reservationSource) {
      throw AppError.notFound('Source de réservation non trouvée');
    }
    
    return reservationSource;
  },

  async deleteReservationSource(id) {
    const doc = await ReservationSource.findById(id);
    if (!doc) {
      throw AppError.notFound('Source de réservation non trouvée');
    }
    const { Reservation } = require('../models');
    const used = await Reservation.countDocuments({ source: doc.code });
    if (used > 0) throw AppError.conflict(`Cette source est utilisée par ${used} réservation(s) : désactivez-la à la place`);
    await ReservationSource.deleteOne({ _id: id });
    
    return { message: 'Source de réservation supprimée avec succès' };
  },
};

module.exports = reservationSourceService;
