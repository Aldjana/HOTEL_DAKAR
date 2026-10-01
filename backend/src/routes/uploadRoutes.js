const express = require('express');
const multer = require('multer');
const router = express.Router();
const c = require('../controllers/uploadController');
const config = require('../config');
const AppError = require('../utils/AppError');
const { auth, requirePermission } = require('../middleware');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.cloudinary.maxFileSize, files: 1 },
  fileFilter: (req, file, cb) => (ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(AppError.badRequest('Format non supporté (JPEG, PNG, WebP ou GIF)'))),
});
// Seuls ceux qui gèrent les chambres ou les paramètres peuvent envoyer des images
const { can } = require('../config/permissions');
const canUpload = (req, res, next) => (
  ['rooms.manage', 'settings.update'].some((p) => can(req.user?.role, p)) ? next() : next(AppError.forbidden('Permissions insuffisantes'))
);

const handle = (req, res, next) => upload.single('file')(req, res, (err) => {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') return next(AppError.badRequest(`Image trop volumineuse (max ${Math.round(config.cloudinary.maxFileSize / 1048576)} Mo)`));
  return next(err);
});

router.get('/status', auth, c.status);
router.post('/image', auth, canUpload, handle, c.uploadImage);
router.delete('/image', auth, canUpload, c.deleteImage);

module.exports = router;
