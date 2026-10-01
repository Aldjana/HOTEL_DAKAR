const { Counter } = require('../models');

const PREFIXES = { reservation: 'RES', invoice: 'FAC', proforma: 'PRO', receipt: 'REC' };

// Numéros séquentiels par année : RES-2026-000001
const nextNumber = async (kind) => {
  const year = new Date().getFullYear();
  const seq = await Counter.next(`${kind}:${year}`);
  return `${PREFIXES[kind] || kind.toUpperCase()}-${year}-${String(seq).padStart(6, '0')}`;
};

module.exports = { nextNumber };
