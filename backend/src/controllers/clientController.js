const service = require('../services/clientService');
const audit = require('../services/auditService');
const response = require('../utils/response');
const h = require('../utils/asyncHandler');

module.exports = {
  createClient: h(async (req, res) => {
    const c = await service.createClient(req.body, req.user);
    audit.log(req, { entity_type: 'client', entity_id: c._id, action: 'create', description: `Création du client ${c.first_name} ${c.last_name}` });
    response.created(res, c, 'Client créé avec succès');
  }),
  getAllClients: h(async (req, res) => {
    const r = await service.getAllClients(req.query);
    response.paginated(res, r.clients, r, 'Clients récupérés');
  }),
  searchClients: h(async (req, res) => response.success(res, await service.searchClients(req.query.q || req.query.search || req.query.term))),
  getClientById: h(async (req, res) => response.success(res, await service.getClientById(req.params.id))),
  updateClient: h(async (req, res) => {
    const c = await service.updateClient(req.params.id, req.body);
    audit.log(req, { entity_type: 'client', entity_id: c._id, action: 'update', description: `Modification du client ${c.first_name} ${c.last_name}` });
    response.success(res, c, 'Client mis à jour');
  }),
  deleteClient: h(async (req, res) => {
    const r = await service.deleteClient(req.params.id);
    audit.log(req, { entity_type: 'client', entity_id: req.params.id, action: r.deleted ? 'delete' : 'update', description: r.message });
    response.success(res, r, r.message);
  }),
  getClientReservations: h(async (req, res) => response.success(res, await service.getClientReservations(req.params.id))),
  getClientHistory: h(async (req, res) => response.success(res, await service.getClientHistory(req.params.id))),
};
