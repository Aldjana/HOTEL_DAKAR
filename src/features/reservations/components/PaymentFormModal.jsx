import { useEffect, useState } from 'react';
import { Modal, Button, Input, Select } from '../../../components/ui';
import { useToast } from '../../../components/feedback/ToastProvider';
import { paymentsApi } from '../../../services/api/paymentsApi';
import { getErrorMessage } from '../../../services/api/client';
import { usePaymentMethods } from '../../../hooks/useReference';
import { formatMoney, todayStr } from '../../../utils/format';
import { useT } from '../../../i18n';

// Enregistre un paiement sur une réservation (avance, solde…). onSaved reçoit le paiement créé.
const PaymentFormModal = ({ isOpen, onClose, reservation, onSaved, defaultAmount }) => {
  const { t } = useT();
  const toast = useToast();
  const methods = usePaymentMethods();
  const balance = Math.max(reservation?.balance_amount ?? 0, 0);
  const [form, setForm] = useState({ amount: '', payment_method: 'cash', reference: '', payment_date: todayStr(), description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) { setForm({ amount: String(defaultAmount ?? (balance || '')), payment_method: 'cash', reference: '', payment_date: todayStr(), description: '' }); setError(''); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reservation?._id]);

  const method = methods.find((m) => m.code === form.payment_method);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const amount = Number(form.amount);
    if (!(amount > 0)) return setError(t('Saisissez un montant supérieur à 0'));
    if (amount > balance) return setError(t('Le montant dépasse le solde restant dû ({amount})', { amount: formatMoney(balance) }));
    if (method?.requires_reference && !form.reference.trim()) return setError(t('Une référence est requise pour « {name} »', { name: method.name }));
    setSaving(true);
    try {
      const payment = await paymentsApi.create({
        reservation_id: reservation._id, amount, payment_method: form.payment_method,
        reference: form.reference || undefined, description: form.description || undefined,
        payment_date: form.payment_date && form.payment_date !== todayStr() ? form.payment_date : undefined,
      });
      toast.success(t('Paiement de {amount} enregistré', { amount: formatMoney(amount) }));
      onSaved?.(payment);
      onClose();
    } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('Enregistrer un paiement')} size="sm">
      <form onSubmit={submit}>
        {reservation && (
          <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">{t('Réservation')}</span><b>{reservation.reservation_number}</b></div>
            <div className="flex justify-between"><span className="text-slate-500">{t('Total')}</span><b>{formatMoney(reservation.total_amount)}</b></div>
            <div className="flex justify-between"><span className="text-slate-500">{t('Déjà réglé')}</span><b>{formatMoney(reservation.paid_amount)}</b></div>
            <div className="flex justify-between"><span className="text-slate-500">{t('Reste à payer')}</span><b className="text-red-600">{formatMoney(balance)}</b></div>
          </div>
        )}
        {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Input label={t('Montant (FCFA)')} type="number" min="1" step="1" required value={form.amount} onChange={set('amount')} />
        <Select label={t('Mode de paiement')} required value={form.payment_method} onChange={set('payment_method')}>
          {(methods.length ? methods : [{ code: 'cash', name: t('Espèces') }]).map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
        </Select>
        <Input label={method?.requires_reference ? t('Référence') : t('Référence (optionnel)')} required={!!method?.requires_reference} value={form.reference} onChange={set('reference')} placeholder={t('N° de transaction, de chèque…')} />
        <Input label={t('Date du paiement')} type="date" max={todayStr()} value={form.payment_date} onChange={set('payment_date')} />
        <Input label={t('Note (optionnel)')} value={form.description} onChange={set('description')} />
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>{t('Annuler')}</Button><Button type="submit" loading={saving}>{t('Enregistrer le paiement')}</Button></div>
      </form>
    </Modal>
  );
};

export default PaymentFormModal;
