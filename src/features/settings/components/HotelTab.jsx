import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { useToast } from '../../../components/feedback/ToastProvider';
import { useApp } from '../../../context/AppContext';
import { settingsApi } from '../../../services/api/settingsApi';
import { getErrorMessage } from '../../../services/api/client';
import { ImageUploadField } from '../../../components/ui';
import Field from './Field';
import PaymentModesCard from './PaymentModesCard';
import { useT } from '../../../i18n';

const FIELDS = ['name', 'address', 'phone', 'email', 'website', 'ninea', 'rccm', 'currency', 'check_in_time', 'check_out_time', 'conditions', 'legal_mentions', 'invoice_footer'];

const HotelTab = ({ admin }) => {
  const toast = useToast();
  const { t } = useT();
  const { settings, setSettings } = useApp();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (settings) setForm({ ...Object.fromEntries(FIELDS.map((k) => [k, settings[k] ?? ''])), logo_url: settings.logo_url || '' }); }, [settings]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error(t("Le nom de l'établissement est requis"));
    setSaving(true);
    try { setSettings(await settingsApi.updateHotel(form)); toast.success(t('Informations enregistrées')); } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-8">
        <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold">
          <Building2 className="h-4 w-4" /> {t('Informations établissement')}
        </h3>
        {form && (
          <form onSubmit={save}>
            <ImageUploadField className="mb-5" folder="logo" value={form.logo_url} onChange={(u) => setForm((x) => ({ ...x, logo_url: u }))} onError={toast.error} empty={t('Aucun logo')} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label={t("Nom de l'hôtel")} required value={form.name} onChange={set('name')} />
              <Field label={t('Téléphone')} value={form.phone} onChange={set('phone')} />
              <Field label={t('Adresse')} value={form.address} onChange={set('address')} />
              <Field label={t('Email de contact')} type="email" value={form.email} onChange={set('email')} />
              <Field label={t('Site web')} value={form.website} onChange={set('website')} />
              <Field label={t('Devise')} value={form.currency} onChange={set('currency')} />
              <Field label="NINEA" value={form.ninea} onChange={set('ninea')} />
              <Field label="RCCM" value={form.rccm} onChange={set('rccm')} />
              <Field label={t('Heure de check-in')} type="time" value={form.check_in_time} onChange={set('check_in_time')} />
              <Field label={t('Heure de check-out')} type="time" value={form.check_out_time} onChange={set('check_out_time')} />
              <Field className="md:col-span-2" label={t('Conditions générales (affichées sur les documents)')} multiline value={form.conditions} onChange={set('conditions')} />
              <Field className="md:col-span-2" label={t('Mentions légales')} multiline rows={2} value={form.legal_mentions} onChange={set('legal_mentions')} />
              <Field className="md:col-span-2" label={t('Pied de facture')} value={form.invoice_footer} onChange={set('invoice_footer')} />
            </div>
            <div className="mt-5 flex justify-end">
              <button type="submit" disabled={saving} className="rounded-lg bg-[#0D1520] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60">
                {saving ? t('Chargement...') : t('Enregistrer les modifications')}
              </button>
            </div>
          </form>
        )}
      </section>
      <PaymentModesCard canWrite={admin} canDelete={admin} />
    </div>
  );
};

export default HotelTab;
