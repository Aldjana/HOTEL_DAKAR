const parsePagination = (query = {}, defaults = { page: 1, limit: 20, max: 200 }) => {
  const page = Math.max(parseInt(query.page, 10) || defaults.page, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaults.limit, 1), defaults.max);
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { parsePagination, escapeRegex };
