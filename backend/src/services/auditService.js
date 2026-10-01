const HistoryLog = require('../models/HistoryLog');
const logger = require('../config/logger');

// Journalisation (CDC §NFR : journalisation des actions importantes). Ne doit jamais casser l'action métier.
const audit = {
  async log(req, { entity_type, entity_id, action, description, metadata }) {
    try {
      const u = req && req.user;
      await HistoryLog.create({
        user_id: u?._id || u?.id,
        user_name: u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email : undefined,
        entity_type,
        entity_id,
        action,
        description,
        metadata,
        ip_address: req?.ip,
      });
    } catch (e) {
      logger.error('Audit log failed', { message: e.message });
    }
  },
};

module.exports = audit;
