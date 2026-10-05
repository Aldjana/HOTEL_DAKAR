import { useEffect, useState } from 'react';
import { useT } from '../../../i18n';
import { Modal, Button, Input, Select } from '../../../components/ui';
import { useToast } from '../../../components/feedback/ToastProvider';
import { clientsApi } from '../../../services/api/clientsApi';
import { getErrorCode, getErrorMessage } from '../../../services/api/client';
import { CLIENT_TYPES, ID_DOCUMENT_TYPES } from '../../../constants/status';

const EMPTY = { first_name: '', last_name: '', client_type: 'individual', company: '', email: '', phone: '', address: '', city: '', nationality: '', id_document_type: '', id_document_number: '', is_vip: false, notes: '' };

// Création / modification d'un client. Gère le doublon (409 DUPLICATE_CLIENT) avec possibilité de forcer.
const ClientFormModal = ({ isOpen, onClose, client = null, onSaved }) => {
  const { t } = useT();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(client ? { ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, client[k] ?? EMPTY[k]])) } : EMPTY);
    setError(''); setDuplicate(false);
  }, [isOpen, client]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e, force = false) => {
    e?.preventDefault();
    // Le submit remonterait sinon (arbre React) jusqu'au formulaire parent, ex. la nouvelle réservation.
    e?.stopPropagation();
    setError('');
    if (form.first_name.trim().length < 2 || form.last_name.trim().length < 2) return setError(t('Le prénom et le nom doivent contenir au moins 2 caractères'));
    if (!form.phone.trim() && !form.email.trim()) return setError(t('Renseignez au moins un téléphone ou un email'));
    const body = { ...form };
    Object.keys(body).forEach((k) => { if (body[k] === '') body[k] = client ? '' : undefined; });
    if (!body.id_document_type) delete body.id_document_type;
    if (force) body.force = true;
    setSaving(true);
    try {
      const saved = client ? await clientsApi.update(client._id, body) : await clientsApi.create(body);
      toast.success(client ? t('Client mis à jour') : t('Client créé'));
      onSaved?.(saved);
      onClose();
    } catch (err) {
      if (getErrorCode(err) === 'DUPLICATE_CLIENT') setDuplicate(true);
      setError(getErrorMessage(err));
    } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={client ? t('Modifier le client') : t('Nouveau client')}>
      <form onSubmit={submit}>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
            {duplicate && !client && <div className="mt-2"><Button size="sm" variant="danger-outline" loading={saving} onClick={() => submit(null, true)}>{t('Créer quand même')}</Button></div>}
          </div>
        )}
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Input label={t('Prénom')} required value={form.first_name} onChange={set('first_name')} />
          <Input label={t('Nom')} required value={form.last_name} onChange={set('last_name')} />
          <Select label={t('Type de client')} value={form.client_type} onChange={set('client_type')} options={CLIENT_TYPES} />
          <Input label={t('Entreprise / organisation')} value={form.company} onChange={set('company')} />
          <Input label={t('Téléphone')} type="tel" value={form.phone} onChange={set('phone')} placeholder="+221 77 000 00 00" />
          <Input label={t('Email')} type="email" value={form.email} onChange={set('email')} />
          <Input label={t('Adresse')} value={form.address} onChange={set('address')} />
          <Input label={t('Ville')} value={form.city} onChange={set('city')} />
          <Input label={t('Nationalité')} value={form.nationality} onChange={set('nationality')} />
          <Select label={t("Pièce d'identité")} value={form.id_document_type} onChange={set('id_document_type')} options={ID_DOCUMENT_TYPES} />
          <Input label={t('N° de pièce')} value={form.id_document_number} onChange={set('id_document_number')} />
          <label className="mb-4 flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.is_vip} onChange={set('is_vip')} className="h-4 w-4 accent-emerald-500" /> {t('Client VIP')}</label>
        </div>
        <Input label={t('Notes')} multiline value={form.notes} onChange={set('notes')} />
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>{t('Annuler')}</Button><Button type="submit" loading={saving}>{client ? t('Enregistrer') : t('Créer le client')}</Button></div>
      </form>
    </Modal>
  );
};

export default ClientFormModal;
