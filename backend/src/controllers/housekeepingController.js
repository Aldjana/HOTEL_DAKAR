const service = require('../services/housekeepingService');
const audit = require('../services/auditService');
const response = require('../utils/response');
const h = require('../utils/asyncHandler');

const log = (req, t, action, description) => audit.log(req, { entity_type: 'housekeeping_task', entity_id: t._id, action, description });
const roomNo = (t) => t.room_id?.room_number || '';

module.exports = {
  createTask: h(async (req, res) => {
    const t = await service.createTask(req.body, req.user);
    log(req, t, 'create', `Tâche ménage créée (chambre ${roomNo(t)})`);
    response.created(res, t, 'Tâche créée');
  }),
  getAllTasks: h(async (req, res) => { const r = await service.getAllTasks(req.query); response.paginated(res, r.tasks, r, 'Tâches récupérées'); }),
  getTaskById: h(async (req, res) => response.success(res, await service.getTaskById(req.params.id))),
  updateTask: h(async (req, res) => {
    const t = await service.updateTask(req.params.id, req.body);
    log(req, t, 'update', `Tâche ménage modifiée (chambre ${roomNo(t)})`);
    response.success(res, t, 'Tâche mise à jour');
  }),
  startTask: h(async (req, res) => {
    const t = await service.startTask(req.params.id, req.user);
    log(req, t, 'update', `Nettoyage démarré (chambre ${roomNo(t)})`);
    response.success(res, t, 'Tâche démarrée');
  }),
  completeTask: h(async (req, res) => {
    const t = await service.completeTask(req.params.id);
    log(req, t, 'update', `Nettoyage terminé (chambre ${roomNo(t)})`);
    response.success(res, t, 'Tâche terminée');
  }),
  assignTask: h(async (req, res) => {
    const t = await service.assignTask(req.params.id, req.body.assigned_to);
    log(req, t, 'update', `Tâche assignée (chambre ${roomNo(t)})`);
    response.success(res, t, 'Tâche assignée');
  }),
  deleteTask: h(async (req, res) => {
    const r = await service.deleteTask(req.params.id);
    log(req, { _id: req.params.id }, 'delete', 'Tâche ménage supprimée');
    response.success(res, null, r.message);
  }),
  getTasksByDate: h(async (req, res) => response.success(res, await service.getTasksByDate(req.query.date))),
  getTaskStatistics: h(async (req, res) => response.success(res, await service.getTaskStatistics())),
  getStaff: h(async (req, res) => response.success(res, await service.getAssignableStaff())),
};
