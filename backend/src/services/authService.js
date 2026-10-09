const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');
const AppError = require('../utils/AppError');
const { hashPassword, comparePassword } = require('../utils/helpers');
const { parsePagination, escapeRegex } = require('../utils/pagination');
const { permissionsForRole } = require('../config/permissions');

const signAccess = (user) => jwt.sign(
  { id: user._id, email: user.email, role: user.role, tv: user.token_version || 0 },
  config.jwt.secret,
  { expiresIn: config.jwt.expiresIn }
);
const signRefresh = (user, remember = true) => jwt.sign(
  { id: user._id, tv: user.token_version || 0, type: 'refresh', rm: !!remember },
  config.jwt.refreshSecret,
  { expiresIn: config.jwt.refreshExpiresIn }
);

const publicUser = (user) => {
  const o = user.toObject ? user.toObject() : { ...user };
  delete o.password_hash;
  o.permissions = permissionsForRole(o.role);
  return o;
};

const validatePassword = (pw) => {
  if (!pw || pw.length < 8) throw AppError.badRequest('Le mot de passe doit comporter au moins 8 caractères');
};

const authService = {
  publicUser,

  async register(data) {
    const email = String(data.email || '').toLowerCase().trim();
    if (await User.findOne({ email })) throw AppError.conflict('Cet email est déjà utilisé', 'EMAIL_EXISTS');
    validatePassword(data.password);
    const user = await User.create({
      email,
      password_hash: await hashPassword(data.password),
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      role: data.role || 'reception',
      is_active: data.is_active !== false,
    });
    return publicUser(user);
  },

  async login(email, password, { remember = true } = {}) {
    const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
    // Même message que le mot de passe faux, pour ne pas révéler l'existence du compte.
    if (!user || !(await comparePassword(password || '', user.password_hash))) {
      throw AppError.unauthorized('Email ou mot de passe incorrect', 'INVALID_CREDENTIALS');
    }
    if (!user.is_active) throw AppError.unauthorized('Ce compte est désactivé. Contactez un administrateur.', 'USER_INACTIVE');

    user.last_login = new Date();
    user.login_count = (user.login_count || 0) + 1;
    await user.save();

    return { user: publicUser(user), token: signAccess(user), refreshToken: signRefresh(user, remember), remember: !!remember };
  },

  async refreshToken(refreshToken) {
    if (!refreshToken) throw AppError.unauthorized('Token de rafraîchissement requis', 'REFRESH_MISSING');
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (e) {
      const expired = e.name === 'TokenExpiredError';
      throw AppError.unauthorized(expired ? 'Session expirée, veuillez vous reconnecter' : 'Token de rafraîchissement invalide', expired ? 'REFRESH_EXPIRED' : 'REFRESH_INVALID');
    }
    const user = await User.findById(decoded.id);
    if (!user || !user.is_active) throw AppError.unauthorized('Compte introuvable ou désactivé', 'USER_INACTIVE');
    if ((decoded.tv || 0) !== (user.token_version || 0)) throw AppError.unauthorized('Session révoquée, veuillez vous reconnecter', 'TOKEN_REVOKED');
    // Rotation : nouveau couple de jetons (la préférence « se souvenir de moi » est conservée).
    const remember = decoded.rm !== false;
    return { token: signAccess(user), refreshToken: signRefresh(user, remember), user: publicUser(user), remember };
  },

  async logout(userId) {
    await User.updateOne({ _id: userId }, { $inc: { token_version: 1 } });
  },

  async changePassword(userId, currentPassword, newPassword, { remember = true } = {}) {
    const user = await User.findById(userId);
    if (!user) throw AppError.notFound('Utilisateur non trouvé');
    if (!(await comparePassword(currentPassword || '', user.password_hash))) {
      throw AppError.badRequest('Mot de passe actuel incorrect');
    }
    validatePassword(newPassword);
    user.password_hash = await hashPassword(newPassword);
    user.token_version = (user.token_version || 0) + 1;
    await user.save();
    return { token: signAccess(user), refreshToken: signRefresh(user, remember), remember: !!remember };
  },

  async getUserById(id) {
    const user = await User.findById(id);
    if (!user) throw AppError.notFound('Utilisateur non trouvé');
    return publicUser(user);
  },

  async getAllUsers(query = {}) {
    const { page, limit, skip } = parsePagination(query, { page: 1, limit: 20, max: 100 });
    const filter = {};
    if (query.role) filter.role = query.role;
    if (query.is_active !== undefined && query.is_active !== '') filter.is_active = String(query.is_active) === 'true';
    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search), 'i');
      filter.$or = [{ first_name: rx }, { last_name: rx }, { email: rx }];
    }
    const [users, total] = await Promise.all([
      User.find(filter).select('-password_hash').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async updateUser(id, data, actor) {
    const user = await User.findById(id);
    if (!user) throw AppError.notFound('Utilisateur non trouvé');
    const isSelf = actor && String(actor.id) === String(id);

    if (data.email && data.email.toLowerCase() !== user.email) {
      if (await User.findOne({ email: data.email.toLowerCase(), _id: { $ne: id } })) {
        throw AppError.conflict('Cet email est déjà utilisé', 'EMAIL_EXISTS');
      }
      user.email = data.email.toLowerCase();
    }
    for (const k of ['first_name', 'last_name', 'phone']) if (data[k] !== undefined) user[k] = data[k];

    const roleChanges = data.role !== undefined && data.role !== user.role;
    const deactivates = data.is_active === false && user.is_active;
    if (isSelf && (roleChanges || deactivates)) {
      throw AppError.badRequest('Vous ne pouvez pas modifier votre propre rôle ni désactiver votre propre compte');
    }
    if ((roleChanges && user.role === 'admin') || (deactivates && user.role === 'admin')) {
      const admins = await User.countDocuments({ role: 'admin', is_active: true });
      if (admins <= 1) throw AppError.badRequest('Impossible : il doit rester au moins un administrateur actif');
    }
    if (roleChanges) { user.role = data.role; user.token_version = (user.token_version || 0) + 1; }
    if (data.is_active !== undefined) {
      user.is_active = !!data.is_active;
      if (deactivates) user.token_version = (user.token_version || 0) + 1;
    }
    if (data.password) {
      validatePassword(data.password);
      user.password_hash = await hashPassword(data.password);
      user.token_version = (user.token_version || 0) + 1;
    }
    await user.save();
    return publicUser(user);
  },

  async resetPassword(id, newPassword) {
    const user = await User.findById(id);
    if (!user) throw AppError.notFound('Utilisateur non trouvé');
    validatePassword(newPassword);
    user.password_hash = await hashPassword(newPassword);
    user.token_version = (user.token_version || 0) + 1;
    await user.save();
    return publicUser(user);
  },

  async deleteUser(id, actor) {
    const user = await User.findById(id);
    if (!user) throw AppError.notFound('Utilisateur non trouvé');
    if (actor && String(actor.id) === String(id)) throw AppError.badRequest('Vous ne pouvez pas supprimer votre propre compte');
    if (user.role === 'admin') {
      const admins = await User.countDocuments({ role: 'admin', is_active: true });
      if (admins <= 1) throw AppError.badRequest('Impossible : il doit rester au moins un administrateur actif');
    }
    await User.deleteOne({ _id: id });
    return user;
  },
};

module.exports = authService;
