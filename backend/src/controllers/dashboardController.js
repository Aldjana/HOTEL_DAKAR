const service = require('../services/dashboardService');
const response = require('../utils/response');
const h = require('../utils/asyncHandler');

module.exports = {
  getDashboardStatistics: h(async (req, res) => response.success(res, await service.getDashboardStatistics(req.user))),
  getAvailabilityCalendar: h(async (req, res) => response.success(res, await service.getAvailabilityCalendar(req.query))),
};
