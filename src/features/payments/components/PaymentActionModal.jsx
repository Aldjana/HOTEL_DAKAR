import { useEffect, useState } from 'react';
import { Button, Input, Modal, Select } from '../../../components/ui';
import { useToast } from '../../../components/feedback/ToastProvider';
import { paymentsApi } from '../../../services/api/paymentsApi';
import { getErrorMessage } from '../../../services/api/client';
import { usePaymentMethods } from '../../../hooks/useReference';
import { formatMoney, toInputDate, todayStr } from '../../../utils/format';
import { useT } from '../../../i18n';

// mode = 'correct' | 'refund' | 'void'. Un motif est toujours exigé (traçabilité).
const TITLES = { correct: 'Corriger le paiement', refund: 'Rembourser le paiement', void: 'Annuler le paiement' };

const PaymentActionModal = ({ isOpen, onClose, payment, mode, onDone }) => {
  const toast = useToast();
  const { t } = useT();
  const methods = usePaymentMethods();
  const [form, setForm] = useState({ amount: '', payment_method: 'cash', reference: '', payment_date: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && payment) { setForm({ amount: String(payment.amount), payment_method: payment.payment_method, reference: payment.reference || '', payment_date: toInputDate(payment.payment_date), reason: '' }); setError(''); }
  }, [isOpen, payment]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.reason.trim()) return setError(t('Le motif est obligatoire'));
    setSaving(true);
    try {
      if (mode === 'correct') await paymentsApi.correct(payment._id, { amount: Number(form.amount), payment_method: form.payment_method, reference: form.reference, payment_date: form.payment_date, reason: form.reason });
      else if (mode === 'refund') await paymentsApi.refund(payment._id, { amount: Number(form.amount), payment_method: form.payment_method, reference: form.reference || undefined, reason: form.reason });
      else await paymentsApi.void(payment._id, form.reason);
      toast.success(mode === 'void' ? t('Paiement annulé') : mode === 'refund' ? t('Remboursement enregistré') : t('Paiement corrigé'));
      onDone?.(); onClose();
    } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t(TITLES[mode])} size="sm">
      {payment && (
        <form onSubmit={submit}>
          <p className="mb-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{payment.receipt_number || payment.transaction_id} · {formatMoney(payment.amount)} · {payment.reservation_id?.reservation_number}</p>
          {mode === 'void' && <p className="mb-3 text-sm text-amber-700">{t("Le paiement sera retiré des totaux et du solde de la réservation. Il reste visible dans l'audit.")}</p>}
          {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {mode !== 'void' && (<>
            <Input label={mode === 'refund' ? t('Montant à rembourser (FCFA)') : t('Montant (FCFA)')} type="number" min="1" required value={form.amount} onChange={set('amount')} />
            <Select label={t('Mode')} value={form.payment_method} onChange={set('payment_method')}>{(methods.length ? methods : [{ code: form.payment_method, name: form.payment_method }]).map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}</Select>
            <Input label={t('Référence')} value={form.reference} onChange={set('reference')} />
            {mode === 'correct' && <Input label={t('Date')} type="date" max={todayStr()} value={form.payment_date} onChange={set('payment_date')} />}
          </>)}
          <Input label={t('Motif (obligatoire)')} multiline rows={2} required value={form.reason} onChange={set('reason')} />
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>{t('Fermer')}</Button><Button type="submit" variant={mode === 'void' ? 'danger' : 'primary'} loading={saving}>{mode === 'void' ? t('Annuler le paiement') : t('Valider')}</Button></div>
        </form>
      )}
    </Modal>
  );
};

export default PaymentActionModal;
