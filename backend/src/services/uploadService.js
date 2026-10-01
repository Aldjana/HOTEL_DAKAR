const { v2: cloudinary } = require('cloudinary');
const config = require('../config');
const AppError = require('../utils/AppError');

const cfg = config.cloudinary;
const isConfigured = () => !!(cfg.url || (cfg.cloudName && cfg.apiKey && cfg.apiSecret));
let ready = false;
const setup = () => {
  if (ready) return;
  // CLOUDINARY_URL est lue automatiquement par le SDK ; sinon on configure explicitement.
  if (!cfg.url) cloudinary.config({ cloud_name: cfg.cloudName, api_key: cfg.apiKey, api_secret: cfg.apiSecret });
  cloudinary.config({ secure: true });
  ready = true;
};

const FOLDERS = ['rooms', 'logo', 'clients', 'misc'];

const uploadService = {
  FOLDERS,
  isConfigured,
  /** Envoie un buffer image vers Cloudinary et retourne { url, public_id, width, height, bytes, format }. */
  async uploadImage(buffer, folder = 'misc') {
    if (!isConfigured()) throw new AppError("Le stockage d'images n'est pas configuré (variables CLOUDINARY_* manquantes)", 503, 'UPLOAD_NOT_CONFIGURED');
    if (!FOLDERS.includes(folder)) throw AppError.badRequest('Dossier inconnu');
    setup();
    try {
      const r = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `${cfg.folder}/${folder}`, resource_type: 'image', overwrite: false },
          (err, result) => (err ? reject(err) : resolve(result)),
        );
        stream.end(buffer);
      });
      return { url: r.secure_url, public_id: r.public_id, width: r.width, height: r.height, bytes: r.bytes, format: r.format };
    } catch (err) {
      throw new AppError(`Envoi de l'image impossible : ${err.message || 'erreur Cloudinary'}`, 502, 'UPLOAD_FAILED');
    }
  },
  /** Supprime une image par son public_id (ignoré si non configuré). */
  async deleteImage(publicId) {
    if (!isConfigured() || !publicId) return false;
    setup();
    const r = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
    return r.result === 'ok';
  },
};

module.exports = uploadService;
