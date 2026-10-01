import { Pencil, Trash2 } from 'lucide-react';
import { useT } from '../../../i18n';

const RoomTypeCard = ({ name, units, features, price, inactive, onEdit, onRemove }) => {
  const { t } = useT();
  return (
    <div className={`rounded-xl border border-slate-100 p-4 ${inactive ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="font-semibold">{name}</div>
        {units && <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{units}</span>}
      </div>
      <div className="mt-2 text-[12px] text-slate-400">{features}</div>
      <div className="mt-3 flex items-center justify-between">
        <div className="font-semibold text-[#0f9f6e]">{price}</div>
        <div className="flex gap-3 text-slate-400">
          {onEdit && <button type="button" title={t('Modifier')} onClick={onEdit}><Pencil className="h-4 w-4" /></button>}
          {onRemove && <button type="button" title={t('Supprimer')} onClick={onRemove}><Trash2 className="h-4 w-4" /></button>}
        </div>
      </div>
    </div>
  );
};

export default RoomTypeCard;
