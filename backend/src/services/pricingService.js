const settingsService = require('./settingsService');
const { diffDays } = require('../utils/dates');
const AppError = require('../utils/AppError');

const round = (n) => Math.round(Number(n) || 0);

// lines: [{ nightly_rate, adults_count }]
const computePricing = async ({ lines, arrival, departure, discount_amount = 0, discount_percent = 0, apply_taxes = true, total_adults }) => {
  const nights = diffDays(arrival, departure);
  if (nights < 1) throw AppError.badRequest("La date de départ doit être après la date d'arrivée");
  const settings = await settingsService.getHotelSettings();

  const subtotal = round(lines.reduce((s, l) => s + Number(l.nightly_rate) * nights, 0));
  let discount = round(discount_amount);
  if (discount_percent) discount += round((subtotal * Number(discount_percent)) / 100);
  if (discount < 0) throw AppError.badRequest('Remise invalide');
  if (discount > subtotal) throw AppError.badRequest('La remise ne peut pas dépasser le montant du séjour');
  const base = subtotal - discount;

  const adults = total_adults ?? lines.reduce((s, l) => s + (l.adults_count || 1), 0);
  const tax_amount = apply_taxes ? round((base * (settings.vat_rate || 0)) / 100) : 0;
  const stay_tax_amount = apply_taxes ? round((settings.stay_tax || 0) * adults * nights) : 0;
  const total_amount = base + tax_amount + stay_tax_amount;

  return { nights, subtotal_amount: subtotal, discount_amount: discount, tax_amount, stay_tax_amount, total_amount, vat_rate: settings.vat_rate || 0 };
};

module.exports = { computePricing, round };
