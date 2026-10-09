const { HousekeepingTask, Room, User, Reservation } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');
const { toDay, addDays } = require('../utils/dates');
const roomService = require('./roomService');
const logger = require('../config/logger');

const POPULATE = [
  { path: 'room_id', populate: 'room_type_id' },
  { path: 'assigned_to', select: 'first_name last_name role' },
];
const populate = (q) => q.populate(POPULATE);
const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

const load = async (id) => {
  const t = await populate(HousekeepingTask.findById(id));
  if (!t) throw AppError.notFound('Tâche non trouvée');
  return t;
};

// Seuls les comptes « ménage » actifs peuvent recevoir une tâche.
const ASSIGNABLE_ROLES = ['housekeeping'];
const assertAssignable = async (userId) => {
  const u = await User.findOne({ _id: userId, is_active: true }).select('role');
  if (!u) throw AppError.notFound('Utilisateur non trouvé');
  if (!ASSIGNABLE_ROLES.includes(u.role)) throw AppError.badRequest('Seul le personnel de ménage peut être assigné à une tâche');
  return u;
};

// Rattrapage des tâches de maintenance manquantes : ne doit jamais bloquer l'affichage du ménage.
const syncMaintenance = () => roomService.ensureMaintenanceTasks().catch((err) => logger.error(`Tâches de maintenance : ${err.message}`, err));

const housekeepingService = {
  async createTask(data, user) {
    const room = await Room.findById(data.room_id);
    if (!room) throw AppError.notFound('Chambre non trouvée');
    if (data.assigned_to) await assertAssignable(data.assigned_to);
    const dup = await HousekeepingTask.findOne({ room_id: room._id, task_type: data.task_type || 'cleaning', status: { $in: ['pending', 'in_progress'] } });
    if (dup) throw AppError.conflict(`Une tâche identique est déjà ouverte pour la chambre ${room.room_number}`);
    const task = await HousekeepingTask.create({
      room_id: room._id, assigned_to: data.assigned_to || undefined, task_type: data.task_type || 'cleaning',
      priority: data.priority || 'medium', status: 'pending', scheduled_date: data.scheduled_date ? new Date(data.scheduled_date) : new Date(), notes: data.notes,
    });
    // Une tâche de nettoyage sur une chambre libre la marque « à nettoyer »
    const occ = await roomService.buildOccupancy([room]);
    if ((task.task_type === 'cleaning' || task.task_type === 'deep_clean') && !['occupied', 'maintenance', 'blocked'].includes(occ[String(room._id)].effective_status) && room.status !== 'cleaning') {
      room.status = 'cleaning'; await room.save();
    }
    return load(task._id);
  },

  async getAllTasks(query = {}) {
    // Une chambre en maintenance sans tâche (ex. statut changé avant cette règle) reçoit la sienne.
    if (!query.task_type || query.task_type === 'maintenance') await syncMaintenance();
    const { page, limit, skip } = parsePagination(query, { page: 1, limit: 50, max: 200 });
    const filter = {};
    for (const k of ['status', 'room_id', 'assigned_to', 'task_type', 'priority']) if (query[k]) filter[k] = query[k];
    if (query.date) filter.scheduled_date = { $gte: toDay(query.date), $lt: addDays(toDay(query.date), 1) };
    const [tasks, total] = await Promise.all([
      populate(HousekeepingTask.find(filter)).sort({ createdAt: -1 }).skip(skip).limit(limit),
      HousekeepingTask.countDocuments(filter),
    ]);
    tasks.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
    return { tasks, total, page, limit };
  },

  getTaskById: (id) => load(id),

  async updateTask(id, data) {
    const task = await HousekeepingTask.findById(id);
    if (!task) throw AppError.notFound('Tâche non trouvée');
    if (['completed'].includes(task.status) && data.status && data.status !== 'completed') throw AppError.conflict('Une tâche terminée ne peut plus être rouverte');
    for (const k of ['priority', 'notes', 'task_type', 'scheduled_date']) if (data[k] !== undefined) task[k] = data[k];
    if (data.assigned_to !== undefined) {
      if (data.assigned_to) await assertAssignable(data.assigned_to);
      task.assigned_to = data.assigned_to || undefined;
    }
    if (data.status === 'in_progress') return this.startTask(id, null, task);
    if (data.status === 'completed') { await task.save(); return this.completeTask(id); }
    if (data.status === 'skipped' || data.status === 'pending') task.status = data.status;
    await task.save();
    return load(id);
  },

  async startTask(id, user, preloaded) {
    const task = preloaded || await HousekeepingTask.findById(id);
    if (!task) throw AppError.notFound('Tâche non trouvée');
    if (task.status === 'completed') throw AppError.conflict('Tâche déjà terminée');
    task.status = 'in_progress';
    if (!task.assigned_to && user?.role === 'housekeeping') task.assigned_to = user._id;
    await task.save();
    return load(id);
  },

  async completeTask(id) {
    const task = await HousekeepingTask.findById(id);
    if (!task) throw AppError.notFound('Tâche non trouvée');
    if (task.status === 'completed') throw AppError.conflict('Tâche déjà terminée');
    task.status = 'completed';
    task.completed_at = new Date();
    await task.save();
    // Chambre prête : « propre » (sauf si occupée ou bloquée en maintenance, ou autre tâche ouverte)
    const room = await Room.findById(task.room_id);
    if (room && ['cleaning', 'available'].includes(room.status) && ['cleaning', 'deep_clean', 'inspection'].includes(task.task_type)) {
      const stillOpen = await HousekeepingTask.countDocuments({ room_id: room._id, status: { $in: ['pending', 'in_progress'] }, task_type: { $in: ['cleaning', 'deep_clean'] } });
      if (!stillOpen) { room.status = 'clean'; await room.save(); }
    } else if (room && room.status === 'maintenance' && task.task_type === 'maintenance') {
      const stillOpen = await HousekeepingTask.countDocuments({ room_id: room._id, status: { $in: ['pending', 'in_progress'] }, task_type: 'maintenance' });
      if (!stillOpen) { room.status = 'available'; await room.save(); }
    }
    return load(id);
  },

  async assignTask(id, assigned_to) {
    const task = await HousekeepingTask.findById(id);
    if (!task) throw AppError.notFound('Tâche non trouvée');
    const user = await assertAssignable(assigned_to);
    task.assigned_to = user._id;
    await task.save();
    return load(id);
  },

  async deleteTask(id) {
    const task = await HousekeepingTask.findByIdAndDelete(id);
    if (!task) throw AppError.notFound('Tâche non trouvée');
    return { message: 'Tâche supprimée avec succès' };
  },

  async getTasksByDate(date) {
    const d = toDay(date || new Date());
    return populate(HousekeepingTask.find({ scheduled_date: { $lt: addDays(d, 1) }, status: { $nin: ['completed', 'skipped'] } })).sort({ scheduled_date: 1 });
  },

  async getAssignableStaff() {
    return User.find({ is_active: true, role: { $in: ASSIGNABLE_ROLES } }).select('first_name last_name role').sort({ first_name: 1 });
  },

  async getTaskStatistics() {
    await syncMaintenance();
    const [pending, inProgress, completed, skipped, total] = await Promise.all([
      // Nettoyage uniquement : les tâches de maintenance ont leur propre compteur (onglet Maintenance)
      HousekeepingTask.countDocuments({ status: 'pending', task_type: { $ne: 'maintenance' } }),
      HousekeepingTask.countDocuments({ status: 'in_progress', task_type: { $ne: 'maintenance' } }),
      HousekeepingTask.countDocuments({ status: 'completed' }),
      HousekeepingTask.countDocuments({ status: 'skipped' }),
      HousekeepingTask.countDocuments(),
    ]);
    const stats = await roomService.getRoomStatistics();
    return {
      total, pending, inProgress, completed, skipped,
      rooms: { toClean: stats.cleaning, inProgress, ready: stats.available, clean: stats.clean, maintenance: stats.maintenance, occupied: stats.occupied, total: stats.total },
    };
  },
};

module.exports = housekeepingService;
