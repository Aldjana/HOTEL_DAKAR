const validate = require('../middleware/validate');
const a = require('./authValidator');
const c = require('./clientValidator');
const r = require('./reservationValidator');
const p = require('./paymentValidator');

// Chaque chaîne de validation est suivie du middleware `validate` : sans lui, les règles ne bloquent rien.
const wrap = (obj) => Object.fromEntries(Object.entries(obj).map(([k, chain]) => [k, [...chain, validate]]));

module.exports = {
  auth: wrap(a),
  client: wrap(c),
  reservation: wrap(r),
  payment: wrap(p),
};
