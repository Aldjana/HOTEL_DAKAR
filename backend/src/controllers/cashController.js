const service = require('../services/cashService');
const audit = require('../services/auditService');
const response = require('../utils/response');
const h = require('../utils/asyncHandler');

module.exports = {
  getDaily: h(async (req, res) => response.success(res, await service.getDaily(req.query))),
  close: h(async (req, res) => {
    const c = await service.close(req.body, req.user);
    audit.log(req, { entity_type: 'cash', entity_id: c._id, action: 'close_cash', description: `Clôture de caisse ${c.date}`, metadata: { net_total: c.net_total, difference: c.difference } });
    response.created(res, c, 'Caisse clôturée');
  }),
  reopen: h(async (req, res) => {
    const c = await service.reopen(req.params.date);
    audit.log(req, { entity_type: 'cash', entity_id: c._id, action: 'reopen_cash', description: `Réouverture de la caisse ${c.date}` });
    response.success(res, c, 'Caisse rouverte');
  }),
  listClosures: h(async (req, res) => response.success(res, await service.listClosures(req.query))),
  cashiers: h(async (req, res) => response.success(res, await service.cashiers())),
};
