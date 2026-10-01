import { Pencil, Trash2 } from 'lucide-react';
import { useT } from '../../../i18n';

const PaymentModeToggle = ({ label, on, disabled, onToggle, onEdit, onRemove }) => {
  const { t } = useT();
  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 text-[13px]">
      <span>{label}</span>
      <span className="flex items-center gap-3">
        {onEdit && <button type="button" title={t('Modifier')} onClick={(e) => { e.preventDefault(); onEdit(); }} className="text-slate-400"><Pencil className="h-4 w-4" /></button>}
        {onRemove && <button type="button" title={t('Supprimer')} onClick={(e) => { e.preventDefault(); onRemove(); }} className="text-slate-400"><Trash2 className="h-4 w-4" /></button>}
        <input type="checkbox" checked={on} disabled={disabled} onChange={onToggle} className="h-4 w-4 accent-[#10B981]" />
      </span>
    </label>
  );
};

export default PaymentModeToggle;
