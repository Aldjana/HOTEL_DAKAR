import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button, ErrorState, Input, Modal, Pagination, Select, Spinner } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useFetch } from '../../../hooks/useFetch';
import { authApi } from '../../../services/api/authApi';
import { getErrorMessage } from '../../../services/api/client';
import { ROLE_OPTIONS } from '../../../constants/status';
import { fullName } from '../../../utils/format';
import UsersTable from './UsersTable';
import { useT } from '../../../i18n';

const EMPTY = { first_name: '', last_name: '', email: '', phone: '', role: 'reception', password: '', is_active: true };

const UsersTab = () => {
  const { user: me } = useAuth();
  const toast = useToast();
  const { t } = useT();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => authApi.listUsers({ page, limit: 15 }), [page]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [resetFor, setResetFor] = useState(null);
  const [pw, setPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const open = (u) => { setEditing(u || {}); setErr(''); setForm(u ? { ...EMPTY, ...u, password: '' } : EMPTY); };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const save = async (e) => {
    e.preventDefault(); setErr('');
    if (!editing._id && form.password.length < 8) return setErr(t('Le mot de passe doit comporter au moins 8 caractères'));
    setSaving(true);
    try {
      if (editing._id) await authApi.updateUser(editing._id, { first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone, role: form.role, is_active: form.is_active });
      else await authApi.createUser({ first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone || undefined, role: form.role, password: form.password });
      toast.success(editing._id ? t('Utilisateur mis à jour') : t('Utilisateur créé')); setEditing(null); reload();
    } catch (er) { setErr(getErrorMessage(er)); } finally { setSaving(false); }
  };
  const reset = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error(t('8 caractères minimum'));
    setSaving(true);
    try { await authApi.resetPassword(resetFor._id, pw); toast.success(t('Mot de passe réinitialisé : l\'utilisateur devra se reconnecter')); setResetFor(null); setPw(''); } catch (er) { toast.error(getErrorMessage(er)); } finally { setSaving(false); }
  };
  const remove = async (u) => {
    if (!(await confirm({ title: t('Supprimer {name} ?', { name: fullName(u) }), message: t("L'historique d'audit est conservé. Préférez la désactivation si l'utilisateur a déjà agi dans l'application."), confirmLabel: t('Supprimer'), danger: true }))) return;
    try { await authApi.deleteUser(u._id); toast.success(t('Utilisateur supprimé')); reload(); } catch (er) { toast.error(getErrorMessage(er)); }
  };

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="m-0 flex items-center gap-2 text-[15px] font-semibold">
          <Users className="h-4 w-4" /> {t('Utilisateurs et rôles')}
        </h3>
        <button type="button" onClick={() => open(null)} className="inline-flex items-center gap-2 rounded-lg bg-[#0D1520] px-3 py-2 text-[13px] font-semibold text-white">
          <Plus className="h-4 w-4" /> {t('Nouvel utilisateur')}
        </button>
      </div>
      {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <UsersTable users={data.items} meId={me?._id} onEdit={open} onReset={(u) => { setResetFor(u); setPw(''); }} onRemove={remove} />
          <Pagination pagination={data.pagination} onPageChange={setPage} label={t('utilisateurs')} />
        </>
      )}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={editing?._id ? t("Modifier l'utilisateur") : t('Nouvel utilisateur')} size="sm">
        <form onSubmit={save}>
          {err && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <Input label={t('Prénom')} required value={form.first_name} onChange={set('first_name')} />
          <Input label={t('Nom')} required value={form.last_name} onChange={set('last_name')} />
          <Input label={t('Email')} type="email" required value={form.email} onChange={set('email')} />
          <Input label={t('Téléphone')} value={form.phone || ''} onChange={set('phone')} />
          <Select label={t('Rôle')} value={form.role} onChange={set('role')} options={ROLE_OPTIONS} helperText={t('Administrateur : tout · Manager : gestion + rapports · Réception : réservations, clients, paiements · Ménage : chambres et tâches')} />
          {!editing?._id && <Input label={t('Mot de passe initial')} type="password" required minLength={8} value={form.password} onChange={set('password')} />}
          {editing?._id && editing._id !== me?._id && <label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="accent-emerald-500" /> {t('Compte actif')}</label>}
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditing(null)}>{t('Annuler')}</Button><Button type="submit" loading={saving}>{t('Enregistrer')}</Button></div>
        </form>
      </Modal>
      <Modal isOpen={!!resetFor} onClose={() => setResetFor(null)} title={t('Nouveau mot de passe — {name}', { name: fullName(resetFor) })} size="sm">
        <form onSubmit={reset}><Input label={t('Nouveau mot de passe')} type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} helperText={t('8 caractères minimum')} /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setResetFor(null)}>{t('Annuler')}</Button><Button type="submit" loading={saving}>{t('Réinitialiser')}</Button></div></form>
      </Modal>
    </section>
  );
};

export default UsersTab;
