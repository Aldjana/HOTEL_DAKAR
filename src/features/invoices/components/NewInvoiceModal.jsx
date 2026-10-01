import { useEffect, useState } from 'react';
import { Modal } from '../../../components/ui';
import { useToast } from '../../../components/feedback/ToastProvider';
import { reservationsApi } from '../../../services/api/reservationsApi';
import { invoicesApi } from '../../../services/api/invoicesApi';
import { getErrorMessage } from '../../../services/api/client';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatDay, formatMoney, fullName } from '../../../utils/format';
import { useT } from '../../../i18n';

// Les factures sont générées depuis une réservation : on choisit la réservation puis on crée la facture.
const NewInvoiceModal = ({ isOpen, onClose, onCreated }) => {
  const toast = useToast();
  const { t } = useT();
  const [term, setTerm] = useState('');
  const q = useDebounce(term, 300);
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!isOpen) { setTerm(''); return undefined; }
    let alive = true;
    reservationsApi.list({ limit: 15, search: q || undefined }).then((r) => alive && setList(r.items)).catch(() => alive && setList([]));
    return () => { alive = false; };
  }, [isOpen, q]);

  const pick = async (r) => {
    setBusy(r._id);
    try { const inv = await invoicesApi.createForReservation(r._id); toast.success(t('Facture générée')); onClose(); onCreated(inv); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(''); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('Nouvelle facture')} size="md">
      <input autoFocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder={t('Rechercher une réservation (n°, client, chambre)…')} className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#4caf50] focus:outline-none" />
      <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
        {list.length === 0 ? <p className="m-0 p-4 text-center text-sm text-slate-500">{t('Aucune réservation trouvée.')}</p> : list.map((r) => (
          <button key={r._id} type="button" disabled={!!busy} onClick={() => pick(r)} className="flex w-full items-center justify-between gap-3 border-0 border-b border-slate-100 bg-white px-4 py-3 text-left last:border-b-0 hover:bg-slate-50 disabled:opacity-60">
            <span><b className="text-sm text-slate-800">{r.reservation_number}</b><span className="block text-xs text-slate-500">{fullName(r.client_id)} · {formatDay(r.arrival_date)} → {formatDay(r.departure_date)}</span></span>
            <span className="text-sm font-semibold text-slate-700">{formatMoney(r.total_amount)}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
};

export default NewInvoiceModal;
