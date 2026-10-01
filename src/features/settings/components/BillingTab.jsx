import { useEffect, useState } from 'react';
import { useToast } from '../../../components/feedback/ToastProvider';
import { settingsApi } from '../../../services/api/settingsApi';
import { getErrorMessage } from '../../../services/api/client';
import { useApp } from '../../../context/AppContext';
import { useT } from '../../../i18n';

const INPUT = 'h-9 rounded-lg border border-slate-200 px-2 text-right';

const BillingTab = () => {
  const toast = useToast();
  const { t } = useT();
  const { refreshSettings } = useApp();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { settingsApi.getBilling().then((b) => setForm({ vat_rate: b.vat_rate, stay_tax: b.stay_tax, cancellation_hours: b.cancellation_hours })).catch((e) => toast.error(getErrorMessage(e))); /* eslint-disable-next-line */ }, []);
  if (!form) return null;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await settingsApi.updateBilling({ vat_rate: Number(form.vat_rate), stay_tax: Number(form.stay_tax), cancellation_hours: Number(form.cancellation_hours) }); await refreshSettings(); toast.success(t('Paramètres de facturation enregistrés (appliqués aux nouvelles réservations)')); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <form onSubmit={save} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-5">
        <h3 className="mb-4 mt-0 text-[15px] font-semibold">{t('Conditions de facturation')}</h3>
        <div className="space-y-3 text-[13px]">
          <label className="flex items-center justify-between gap-3">
            {t('Taxe de séjour (par adulte/nuit)')}
            <span className="flex items-center gap-2"><input type="number" min="0" value={form.stay_tax} onChange={set('stay_tax')} className={`${INPUT} w-24`} /> FCFA</span>
          </label>
          <label className="flex items-center justify-between gap-3">
            {t('TVA Applicable')}
            <span className="flex items-center gap-2"><input type="number" min="0" max="100" step="0.01" value={form.vat_rate} onChange={set('vat_rate')} className={`${INPUT} w-20`} /> %</span>
          </label>
          <label className="flex items-center justify-between gap-3">
            {t('Délai d\'annulation gratuite')}
            <span className="flex items-center gap-2"><input type="number" min="0" value={form.cancellation_hours} onChange={set('cancellation_hours')} className={`${INPUT} w-20`} /> {t('HEURES')}</span>
          </label>
        </div>
        <p className="mb-0 mt-4 text-[12px] text-slate-400">{t('La TVA s\'applique sur l\'hébergement après remise. Les taxes peuvent être désactivées réservation par réservation (exonération). Les montants des réservations existantes ne sont pas recalculés.')}</p>
        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={saving} className="rounded-lg bg-[#0D1520] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60">{saving ? t('Chargement...') : t('Enregistrer les modifications')}</button>
        </div>
      </form>
    </div>
  );
};

export default BillingTab;
