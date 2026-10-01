const uploadService = require('../services/uploadService');
const response = require('../utils/response');
const audit = require('../services/auditService');
const AppError = require('../utils/AppError');

module.exports = {
  async status(req, res, next) {
    try { response.success(res, { configured: uploadService.isConfigured(), folders: uploadService.FOLDERS }); } catch (e) { next(e); }
  },
  async uploadImage(req, res, next) {
    try {
      if (!req.file) throw AppError.badRequest('Aucun fichier reçu (champ « file »)');
      const result = await uploadService.uploadImage(req.file.buffer, req.body.folder || 'misc');
      audit.log(req, { entity_type: 'upload', entity_id: undefined, action: 'create', description: `Image envoyée (${req.body.folder || 'misc'}) : ${result.public_id}` });
      response.created(res, result, 'Image envoyée');
    } catch (e) { next(e); }
  },
  async deleteImage(req, res, next) {
    try {
      const publicId = String(req.body.public_id || '');
      if (!publicId) throw AppError.badRequest('public_id requis');
      response.success(res, { deleted: await uploadService.deleteImage(publicId) }, 'Image supprimée');
    } catch (e) { next(e); }
  },
};
