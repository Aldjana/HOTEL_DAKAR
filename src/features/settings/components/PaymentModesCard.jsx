import { CreditCard } from 'lucide-react';
import { Spinner } from '../../../components/ui';
import { paymentModesApi } from '../../../services/api/roomsApi';
import PaymentModeToggle from './PaymentModeToggle';
import { useReferenceCrud } from './useReferenceCrud';
import { useT } from '../../../i18n';

const FIELDS = [
  { key: 'name', label: 'Nom', required: true },
  { key: 'code', label: 'Code technique', required: true, helper: 'Ex. : wave, orange_money, credit_card (minuscules, sans espace)' },
  { key: 'requires_reference', label: 'Référence obligatoire', type: 'checkbox' },
];

const PaymentModesCard = ({ canWrite, canDelete }) => {
  const { t } = useT();
  const crud = useReferenceCrud({ api: paymentModesApi, fields: FIELDS, cacheKey: 'methods', itemLabel: 'un mode' });
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-4">
      <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold">
        <CreditCard className="h-4 w-4" /> {t('Modes de paiement')}
      </h3>
      {crud.loading && !crud.items.length ? <Spinner /> : (
        <div className="space-y-3">
          {crud.items.map((mode) => (
            <PaymentModeToggle
              key={mode._id}
              label={mode.name}
              on={mode.is_active !== false}
              disabled={!canWrite}
              onToggle={() => crud.toggle(mode)}
              onEdit={canWrite ? () => crud.open(mode) : undefined}
              onRemove={canWrite && canDelete ? () => crud.remove(mode) : undefined}
            />
          ))}
        </div>
      )}
      {canWrite && (
        <button type="button" onClick={() => crud.open(null)} className="mt-4 w-full rounded-xl border border-dashed border-slate-300 py-2 text-[12px] font-semibold text-slate-500">
          {t('+ Ajouter un mode')}
        </button>
      )}
      {crud.modal}
    </section>
  );
};

export default PaymentModesCard;
