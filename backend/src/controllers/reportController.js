const reports = require('../services/reportService');
const planning = require('../services/planningService');
const exportService = require('../services/exportService');
const audit = require('../services/auditService');
const response = require('../utils/response');
const h = require('../utils/asyncHandler');

module.exports = {
  overview: h(async (req, res) => response.success(res, await reports.overview(req.query))),
  occupancy: h(async (req, res) => response.success(res, await reports.occupancy(req.query))),
  receivables: h(async (req, res) => response.success(res, await reports.receivables())),
  usage: h(async (req, res) => response.success(res, await reports.usage(req.query))),
  planning: h(async (req, res) => response.success(res, await planning.getPlanning(req.query))),
  export: h(async (req, res) => {
    const { type } = req.params;
    const format = String(req.query.format || 'xlsx').toLowerCase();
    const out = await exportService.build(type, format, req.query, req.user);
    audit.log(req, { entity_type: 'export', action: 'export', description: `Export ${type} (${format})`, metadata: { type, format } });
    res.setHeader('Content-Type', out.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
    res.setHeader('Content-Length', out.buffer.length);
    res.send(out.buffer);
  }),
};
