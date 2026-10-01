import { useState } from 'react';
import { Button, Input, Modal } from '../../../components/ui';
import { useToast } from '../../../components/feedback/ToastProvider';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useFetch } from '../../../hooks/useFetch';
import { invalidateReference } from '../../../hooks/useReference';
import { getErrorMessage } from '../../../services/api/client';
import { useT } from '../../../i18n';

// CRUD générique (types de chambre, modes de paiement, sources) : liste + modale d'ajout / modification + activation + suppression.
// fields: [{ key, label, type, required, min, helper }]
export const useReferenceCrud = ({ api, fields, cacheKey, itemLabel, toBody }) => {
  const toast = useToast();
  const { t } = useT();
  const confirm = useConfirm();
  const { data, loading, reload } = useFetch(() => api.list(), []);
  const [editing, setEditing] = useState(null); // item | {} (nouveau)
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const open = (item) => {
    setEditing(item || {}); setError('');
    setForm({ ...Object.fromEntries(fields.map((f) => [f.key, item?.[f.key] ?? (f.type === 'checkbox' ? false : '')])), is_active: item ? item.is_active !== false : true });
  };
  const save = async (e) => {
    e.preventDefault(); setError('');
    for (const f of fields) if (f.required && !String(form[f.key] ?? '').trim()) return setError(t('{label} : champ requis', { label: t(f.label) }));
    setSaving(true);
    try {
      const body = toBody ? toBody(form) : form;
      if (editing._id) await api.update(editing._id, { ...body, is_active: form.is_active }); else await api.create(body);
      invalidateReference(cacheKey);
      toast.success(t('Enregistré')); setEditing(null); reload();
    } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  };
  const toggle = async (item) => { try { await api.update(item._id, { is_active: item.is_active === false }); invalidateReference(cacheKey); reload(); } catch (err) { toast.error(getErrorMessage(err)); } };
  const remove = async (item) => {
    if (!(await confirm({ title: t('Supprimer « {name} » ?', { name: item.name }), message: t('Impossible si cet élément est déjà utilisé : désactivez-le dans ce cas.'), confirmLabel: t('Supprimer'), danger: true }))) return;
    try { await api.remove(item._id); invalidateReference(cacheKey); toast.success(t('Supprimé')); reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const modal = (
    <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={t(`${editing?._id ? 'Modifier' : 'Ajouter'} ${itemLabel}`)} size="sm">
      <form onSubmit={save}>
        {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {fields.map((f) => f.type === 'checkbox'
          ? <label key={f.key} className="mb-4 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} className="h-4 w-4 accent-emerald-500" /> {t(f.label)}</label>
          : <Input key={f.key} label={t(f.label)} type={f.type || 'text'} required={f.required} min={f.min} value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} helperText={f.helper && t(f.helper)} />)}
        {editing?._id && <label className="mb-4 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 accent-emerald-500" /> {t('Actif')}</label>}
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditing(null)}>{t('Annuler')}</Button><Button type="submit" loading={saving}>{t('Enregistrer')}</Button></div>
      </form>
    </Modal>
  );

  return { items: data || [], loading, open, toggle, remove, modal, reload };
};
