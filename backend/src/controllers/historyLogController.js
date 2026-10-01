const historyLogService = require('../services/historyLogService');
const response = require('../utils/response');

const historyLogController = {
  async getAllHistoryLogs(req, res, next) {
    try {
      const result = await historyLogService.getAllHistoryLogs(req.query);
      response.paginated(res, result.historyLogs, result, 'Historiques récupérés avec succès');
    } catch (error) {
      next(error);
    }
  },

  async getHistoryLogById(req, res, next) {
    try {
      const historyLog = await historyLogService.getHistoryLogById(req.params.id);
      response.success(res, historyLog);
    } catch (error) {
      next(error);
    }
  },

  async deleteHistoryLog(req, res, next) {
    try {
      await historyLogService.deleteHistoryLog(req.params.id);
      response.success(res, null, 'Historique supprimé avec succès');
    } catch (error) {
      next(error);
    }
  },

  async getLogsByEntity(req, res, next) {
    try {
      const logs = await historyLogService.getLogsByEntity(req.params.entityType, req.params.entityId);
      response.success(res, logs, 'Historiques de l\'entité récupérés avec succès');
    } catch (error) {
      next(error);
    }
  },

  async getLogsByUser(req, res, next) {
    try {
      const logs = await historyLogService.getLogsByUser(req.params.userId);
      response.success(res, logs, 'Historiques de l\'utilisateur récupérés avec succès');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = historyLogController;
