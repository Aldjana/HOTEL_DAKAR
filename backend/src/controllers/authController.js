const authService = require('../services/authService');
const audit = require('../services/auditService');
const response = require('../utils/response');
const refreshCookie = require('../utils/refreshCookie');

// Mode cookie (navigateur) : le jeton de renouvellement part dans un cookie httpOnly et n'est jamais
// renvoyé dans le corps. Sans `use_cookie` (autres clients, tests), le comportement historique est conservé.
const deliver = (req, res, result) => {
  const { remember, ...body } = result;
  if (req.body?.use_cookie) {
    refreshCookie.set(res, body.refreshToken, remember);
    delete body.refreshToken;
  }
  return body;
};

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

module.exports = {
  register: wrap(async (req, res) => {
    const user = await authService.register(req.body);
    audit.log(req, { entity_type: 'user', entity_id: user._id, action: 'create', description: `Création de l'utilisateur ${user.email} (${user.role})` });
    response.created(res, user, 'Utilisateur créé avec succès');
  }),

  login: wrap(async (req, res) => {
    const result = await authService.login(req.body.email, req.body.password, { remember: req.body.remember !== false });
    audit.log({ user: { ...result.user, id: result.user._id }, ip: req.ip }, { entity_type: 'auth', entity_id: result.user._id, action: 'login', description: `Connexion de ${result.user.email}` });
    response.success(res, deliver(req, res, result), 'Connexion réussie');
  }),

  refreshToken: wrap(async (req, res) => {
    const bodyToken = req.body.refresh_token || req.body.refreshToken;
    const cookieToken = refreshCookie.read(req);
    // Jeton venu du cookie (ou ancien jeton migré vers le cookie) : réponse en mode cookie.
    if (!bodyToken && cookieToken) req.body.use_cookie = true;
    try {
      response.success(res, deliver(req, res, await authService.refreshToken(bodyToken || cookieToken)), 'Session renouvelée');
    } catch (err) {
      if (req.body.use_cookie) refreshCookie.clear(res);
      throw err;
    }
  }),

  logout: wrap(async (req, res) => {
    await authService.logout(req.user.id);
    refreshCookie.clear(res);
    audit.log(req, { entity_type: 'auth', entity_id: req.user._id, action: 'logout', description: `Déconnexion de ${req.user.email}` });
    response.success(res, null, 'Déconnexion réussie');
  }),

  getMe: wrap(async (req, res) => response.success(res, await authService.getUserById(req.user.id))),

  changePassword: wrap(async (req, res) => {
    const { current_password, new_password } = req.body;
    const tokens = await authService.changePassword(req.user.id, current_password, new_password, { remember: req.body.remember !== false });
    audit.log(req, { entity_type: 'user', entity_id: req.user._id, action: 'update', description: 'Changement de mot de passe' });
    response.success(res, deliver(req, res, tokens), 'Mot de passe modifié');
  }),

  getAllUsers: wrap(async (req, res) => {
    const r = await authService.getAllUsers(req.query);
    response.paginated(res, r.users, r.pagination, 'Utilisateurs récupérés');
  }),

  getUserById: wrap(async (req, res) => response.success(res, await authService.getUserById(req.params.id))),

  updateUser: wrap(async (req, res) => {
    const user = await authService.updateUser(req.params.id, req.body, req.user);
    audit.log(req, { entity_type: 'user', entity_id: user._id, action: 'update', description: `Modification de l'utilisateur ${user.email}` });
    response.success(res, user, 'Utilisateur mis à jour');
  }),

  resetPassword: wrap(async (req, res) => {
    const user = await authService.resetPassword(req.params.id, req.body.new_password);
    audit.log(req, { entity_type: 'user', entity_id: user._id, action: 'update', description: `Réinitialisation du mot de passe de ${user.email}` });
    response.success(res, user, 'Mot de passe réinitialisé');
  }),

  deleteUser: wrap(async (req, res) => {
    const user = await authService.deleteUser(req.params.id, req.user);
    audit.log(req, { entity_type: 'user', entity_id: user._id, action: 'delete', description: `Suppression de l'utilisateur ${user.email}` });
    response.success(res, null, 'Utilisateur supprimé');
  }),
};
