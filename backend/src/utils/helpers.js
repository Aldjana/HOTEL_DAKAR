const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const generateId = () => uuidv4();

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

const formatCurrency = (amount, currency = 'FCFA') => {
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
};

const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const generateReservationNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RES-${timestamp}-${random}`;
};

const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${timestamp}-${random}`;
};

const generateTransactionId = () => {
  const timestamp = Date.now().toString().slice(-8);
  return `TXN-${timestamp}`;
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

module.exports = {
  generateId,
  hashPassword,
  comparePassword,
  formatCurrency,
  calculateNights,
  generateReservationNumber,
  generateInvoiceNumber,
  generateTransactionId,
  slugify,
};
