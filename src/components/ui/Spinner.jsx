import { Loader2 } from 'lucide-react';
import { useT } from '../../i18n';

export const Spinner = ({ label, className = '' }) => {
  const { t } = useT();
  return (
    <div className={`flex items-center justify-center gap-2 py-12 text-slate-500 ${className}`} role="status"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">{label ?? t('Chargement…')}</span></div>
  );
};

export const ErrorState = ({ message, onRetry }) => {
  const { t } = useT();
  return (
  <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
    <p className="m-0 mb-3 text-sm text-red-700">{message || t('Impossible de charger les données.')}</p>
    {onRetry && <button type="button" onClick={onRetry} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50">{t('Réessayer')}</button>}
  </div>
  );
};

export default Spinner;
