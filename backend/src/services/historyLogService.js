const HistoryLog = require('../models/HistoryLog');
const AppError = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');

const historyLogService = {
  async getAllHistoryLogs(query = {}) {
    const { page, limit, skip } = parsePagination(query, { page: 1, limit: 20, max: 200 });
    const filter = {};
    if (query.user_id) filter.user_id = query.user_id;
    if (query.entity_type) filter.entity_type = query.entity_type;
    if (query.action) filter.action = query.action;
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(query.to);
    }
    const [historyLogs, total] = await Promise.all([
      HistoryLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      HistoryLog.countDocuments(filter),
    ]);
    return { historyLogs, total, page, limit };
  },
  async getHistoryLogById(id) {
    const log = await HistoryLog.findById(id);
    if (!log) throw AppError.notFound('Historique non trouvé');
    return log;
  },
  async createHistoryLog(data) { return HistoryLog.create(data); },
  async getLogsByEntity(entityType, entityId) {
    return HistoryLog.find({ entity_type: entityType, entity_id: entityId }).sort({ createdAt: -1 });
  },
  async getLogsByUser(userId) {
    return HistoryLog.find({ user_id: userId }).sort({ createdAt: -1 }).limit(200);
  },
  async deleteHistoryLog(id) {
    const log = await HistoryLog.findByIdAndDelete(id);
    if (!log) throw AppError.notFound('Historique non trouvé');
    return { message: 'Historique supprimé avec succès' };
  },
};

module.exports = historyLogService;
