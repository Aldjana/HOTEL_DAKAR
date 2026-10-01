const { HotelSettings } = require('../models');
const AppError = require('../utils/AppError');

const EDITABLE = ['name', 'logo_url', 'address', 'phone', 'email', 'website', 'ninea', 'rccm', 'currency',
  'check_in_time', 'check_out_time', 'stay_tax', 'vat_rate', 'cancellation_hours', 'conditions',
  'legal_mentions', 'invoice_footer', 'cash_notes'];

const settingsService = {
  async getHotelSettings() {
    let settings = await HotelSettings.findOne();
    if (!settings) settings = await HotelSettings.create({});
    return settings;
  },
  async updateHotelSettings(data = {}) {
    const settings = await this.getHotelSettings();
    if (data.logo_url && !/^(https?:\/\/\S+|data:image\/)/i.test(data.logo_url)) throw AppError.badRequest('URL du logo invalide');
    if (data.logo_url && data.logo_url.length > 1_500_000) throw AppError.badRequest('Logo trop volumineux (max ~1 Mo)');
    for (const k of EDITABLE) if (data[k] !== undefined) settings[k] = data[k];
    if (data.name !== undefined && !String(data.name).trim()) throw AppError.badRequest("Le nom de l'établissement est requis");
    for (const k of ['check_in_time', 'check_out_time']) {
      if (data[k] !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(data[k])) throw AppError.badRequest('Heure invalide (format HH:MM)');
    }
    return settings.save();
  },
  async getPublicInfo() {
    const s = await this.getHotelSettings();
    return { name: s.name, logo_url: s.logo_url, currency: s.currency };
  },
  async getBillingSettings() {
    const s = await this.getHotelSettings();
    return {
      tax_rate: s.vat_rate || 0,
      vat_rate: s.vat_rate || 0,
      stay_tax: s.stay_tax || 0,
      cancellation_hours: s.cancellation_hours,
      cancellation_policy: `${s.cancellation_hours || 48}h`,
      currency: s.currency,
    };
  },
  async updateBillingSettings(data = {}) {
    const s = await this.getHotelSettings();
    const vat = data.vat_rate ?? data.tax_rate;
    if (vat !== undefined) {
      if (Number(vat) < 0 || Number(vat) > 100) throw AppError.badRequest('TVA invalide');
      s.vat_rate = Number(vat);
    }
    if (data.stay_tax !== undefined) {
      if (Number(data.stay_tax) < 0) throw AppError.badRequest('Taxe de séjour invalide');
      s.stay_tax = Number(data.stay_tax);
    }
    if (data.cancellation_hours !== undefined) s.cancellation_hours = Number(data.cancellation_hours);
    await s.save();
    return this.getBillingSettings();
  },
  async getReservationSources() {
    const { ReservationSource } = require('../models');
    return ReservationSource.find({ is_active: true }).sort({ name: 1 });
  },
  async updateReservationSources(sources = []) {
    const s = await this.getHotelSettings();
    s.reservation_sources = sources;
    return s.save();
  },
};

module.exports = settingsService;
