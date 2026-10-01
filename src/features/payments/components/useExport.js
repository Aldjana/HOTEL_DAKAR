import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { downloadFile } from '../../../services/download';
import { getErrorMessage } from '../../../services/api/client';
import { useT } from '../../../i18n';

// Export Excel / PDF (GET /reports/export/:type) — même logique que ExportButtons, sans son rendu.
export const useExport = (type, params = {}) => {
  const { can } = useAuth();
  const toast = useToast();
  const { t } = useT();
  const [busy, setBusy] = useState('');
  const run = async (format) => {
    setBusy(format);
    try { await downloadFile(`/reports/export/${type}`, { ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)), format }, `${type}.${format}`); }
    catch (err) { toast.error(getErrorMessage(err, t('Export impossible'))); } finally { setBusy(''); }
  };
  return { allowed: can('exports.read'), busy, run };
};
