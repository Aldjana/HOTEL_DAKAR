import { useEffect, useState } from 'react';
import { Modal } from '../../../components/ui';
import { useT } from '../../../i18n';
import { reservationsApi } from '../../../services/api/reservationsApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatDay, formatMoney, fullName } from '../../../utils/format';
import PaymentFormModal from '../../reservations/components/PaymentFormModal';

// Choix d'une réservation avec solde dû, puis saisie du paiement.
const NewPaymentModal = ({ isOpen, onClose, onSaved }) => {
  const { t } = useT();
  const [term, setTerm] = useState('');
  const q = useDebounce(term, 300);
  const [list, setList] = useState([]);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    if (!isOpen) { setPicked(null); setTerm(''); return undefined; }
    let alive = true;
    reservationsApi.list({ limit: 15, search: q || undefined, status: 'pending,confirmed,checked_in,checked_out', payment_status: 'unpaid,deposit,partial' }).then((r) => alive && setList(r.items)).catch(() => alive && setList([]));
    return () => { alive = false; };
  }, [isOpen, q]);

  if (picked) return <PaymentFormModal isOpen reservation={picked} onClose={() => { setPicked(null); onClose(); }} onSaved={onSaved} />;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('Nouveau paiement')} size="md">
      <input autoFocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder={t('Rechercher une réservation (n°, client, chambre)…')} className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#4caf50] focus:outline-none" />
      <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
        {list.length === 0 ? <p className="m-0 p-4 text-center text-sm text-slate-500">{t('Aucune réservation avec un solde à payer.')}</p> : list.map((r) => (
          <button key={r._id} type="button" onClick={() => setPicked(r)} className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50">
            <span><b className="text-sm text-slate-800">{r.reservation_number}</b><span className="block text-xs text-slate-500">{fullName(r.client_id)} · {formatDay(r.arrival_date)} → {formatDay(r.departure_date)}</span></span>
            <span className="text-sm font-semibold text-red-600">{formatMoney(r.balance_amount)}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
};

export default NewPaymentModal;
