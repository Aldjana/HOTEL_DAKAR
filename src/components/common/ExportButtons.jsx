import { useState } from 'react';
import { Download } from 'lucide-react';
import Button from '../ui/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../feedback/ToastProvider';
import { downloadFile } from '../../services/download';
import { getErrorMessage } from '../../services/api/client';
import { useT, tr } from '../../i18n';

// Exports Excel / PDF (GET /reports/export/:type). Visible uniquement pour les rôles autorisés.
const ExportButtons = ({ type, params = {} }) => {
  useT();
  const { can } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState('');
  if (!can('exports.read')) return null;
  const go = async (format) => {
    setBusy(format);
    try { await downloadFile(`/reports/export/${type}`, { ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)), format }, `${type}.${format}`); }
    catch (err) {
      let msg = getErrorMessage(err, tr('Export impossible'));
      toast.error(msg);
    } finally { setBusy(''); }
  };
  return (
    <>
      <Button variant="outline" size="sm" loading={busy === 'xlsx'} onClick={() => go('xlsx')}><Download className="h-4 w-4" /> Excel</Button>
      <Button variant="outline" size="sm" loading={busy === 'pdf'} onClick={() => go('pdf')}><Download className="h-4 w-4" /> PDF</Button>
    </>
  );
};

export default ExportButtons;
