const PaymentMode = require('../models/PaymentMode');
const AppError = require('../utils/AppError');

const paymentModeService = {
  async getAllPaymentModes(query = {}) {
    const { page = 1, limit = 200, is_active } = query;
    
    const filter = {};
    if (is_active !== undefined) {
      filter.is_active = is_active === 'true';
    }
    
    const skip = (page - 1) * limit;
    
    const [paymentModes, total] = await Promise.all([
      PaymentMode.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      PaymentMode.countDocuments(filter),
    ]);
    
    return {
      paymentModes,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    };
  },

  async getPaymentModeById(id) {
    const paymentMode = await PaymentMode.findById(id);
    
    if (!paymentMode) {
      throw AppError.notFound('Mode de paiement non trouvé');
    }
    
    return paymentMode;
  },

  async createPaymentMode(paymentModeData) {
    const paymentMode = await PaymentMode.create(paymentModeData);
    return paymentMode;
  },

  async updatePaymentMode(id, updateData) {
    const paymentMode = await PaymentMode.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!paymentMode) {
      throw AppError.notFound('Mode de paiement non trouvé');
    }
    
    return paymentMode;
  },

  async deletePaymentMode(id) {
    const doc = await PaymentMode.findById(id);
    if (!doc) {
      throw AppError.notFound('Mode de paiement non trouvé');
    }
    const { Payment } = require('../models');
    const used = await Payment.countDocuments({ payment_method: doc.code });
    if (used > 0) throw AppError.conflict(`Ce mode est utilisé par ${used} paiement(s) : désactivez-le à la place`);
    await PaymentMode.deleteOne({ _id: id });
    
    return { message: 'Mode de paiement supprimé avec succès' };
  },
};

module.exports = paymentModeService;
