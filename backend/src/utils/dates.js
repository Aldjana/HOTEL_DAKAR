const AppError = require('./AppError');

// Les dates de séjour sont des dates calendaires : on les normalise à minuit UTC.
const toDay = (input) => {
  if (input === undefined || input === null || input === '') return null;
  let y, m, d;
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}/.test(input)) {
    [y, m, d] = input.slice(0, 10).split('-').map(Number);
  } else {
    const dt = new Date(input);
    if (Number.isNaN(dt.getTime())) throw AppError.badRequest('Date invalide');
    y = dt.getUTCFullYear(); m = dt.getUTCMonth() + 1; d = dt.getUTCDate();
  }
  return new Date(Date.UTC(y, m - 1, d));
};

const today = () => toDay(new Date());
const addDays = (date, n) => new Date(date.getTime() + n * 86400000);
const diffDays = (a, b) => Math.round((toDay(b) - toDay(a)) / 86400000);
const ymd = (date) => new Date(date).toISOString().slice(0, 10);
const startOfDayRange = (dateStr) => {
  const s = toDay(dateStr);
  return { from: s, to: addDays(s, 1) };
};

module.exports = { toDay, today, addDays, diffDays, ymd, startOfDayRange };
