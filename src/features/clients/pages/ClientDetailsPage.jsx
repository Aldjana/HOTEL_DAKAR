import { useState } from 'react';
import { useT } from '../../../i18n';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, Pencil, Star, Trash2 } from 'lucide-react';
import { Badge, Button, Card, ErrorState, Spinner, Table } from '../../../components/ui';
import { StatusBadge } from '../../../components/common';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useFetch } from '../../../hooks/useFetch';
import { clientsApi } from '../../../services/api/clientsApi';
import { getErrorMessage } from '../../../services/api/client';
import { CLIENT_TYPE_LABELS, paymentMethodLabel } from '../../../constants/status';
import { formatDay, formatMoney, fullName } from '../../../utils/format';
import ClientFormModal from '../components/ClientFormModal';

const Row = ({ label, value }) => value ? <div className="flex justify-between gap-3 py-1.5 text-sm"><span className="text-slate-500">{label}</span><span className="text-right font-medium text-slate-800">{value}</span></div> : null;

const ClientDetailsPage = () => {
  const { t } = useT();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { can } = useAuth();
  const [editing, setEditing] = useState(false);
  const { data, loading, error, reload } = useFetch(() => clientsApi.history(id), [id]);

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { client, reservations, payments, invoices, summary } = data;

  const remove = async () => {
    if (!(await confirm({ title: t('Supprimer ce client ?'), message: t('Un client ayant un historique sera désactivé (conservé pour les archives) plutôt que supprimé.'), confirmLabel: t('Supprimer'), danger: true }))) return;
    try {
      const r = await clientsApi.remove(id);
      toast.success(r?.message || t('Client supprimé'));
      navigate('/clients');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const resCols = [
    { key: 'reservation_number', label: t('Réservation'), render: (v) => <b>{v}</b> },
    { key: 'arrival_date', label: t('Séjour'), render: (_, r) => `${formatDay(r.arrival_date)} → ${formatDay(r.departure_date)}` },
    { key: 'room_id', label: t('Chambre'), render: (v, r) => (r.rooms?.length > 1 ? r.rooms.map((l) => l.room_number).join(', ') : v?.room_number || '—') },
    { key: 'status', label: t('Statut'), render: (v) => <StatusBadge status={v} /> },
    { key: 'total_amount', label: t('Total'), align: 'right', render: (v) => formatMoney(v) },
    { key: 'balance_amount', label: t('Solde'), align: 'right', render: (v) => <span className={v > 0 ? 'font-semibold text-red-600' : ''}>{formatMoney(v)}</span> },
  ];

  return (
    <div>
      <Link to="/clients" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 no-underline hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> {t('Clients')}</Link>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[22px] font-semibold text-slate-800">{fullName(client)} {client.is_vip && <Star className="inline h-5 w-5 fill-amber-400 text-amber-400" />}</h2>
          <div className="mt-1 flex flex-wrap gap-2"><Badge size="sm">{CLIENT_TYPE_LABELS[client.client_type] || client.client_type}</Badge>{client.is_active === false && <Badge variant="error" size="sm">{t('Désactivé')}</Badge>}{summary.stays >= 2 && <Badge variant="purple" size="sm">{t('Client fidèle')}</Badge>}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {can('reservations.write') && client.is_active !== false && <Button onClick={() => navigate(`/reservations/new?client=${client._id}`)}><CalendarPlus className="h-4 w-4" /> {t('Nouvelle réservation')}</Button>}
          {can('clients.write') && <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> {t('Modifier')}</Button>}
          {can('clients.delete') && <Button variant="danger-outline" onClick={remove}><Trash2 className="h-4 w-4" /> {t('Supprimer')}</Button>}
        </div>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-4">
        {[['Séjours', summary.stays], ['Total facturé', formatMoney(summary.total_billed)], ['Total réglé', formatMoney(summary.total_paid)], ['Solde dû', formatMoney(summary.balance_due)]].map(([l, v]) => (
          <Card key={l}><p className="m-0 text-xs uppercase text-slate-500">{t(l)}</p><p className={`m-0 mt-1 text-xl font-bold ${l === 'Solde dû' && summary.balance_due > 0 ? 'text-red-600' : 'text-slate-800'}`}>{v}</p></Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={t('Coordonnées')}>
          <Row label={t('Téléphone')} value={client.phone} /><Row label={t('Email')} value={client.email} /><Row label={t('Entreprise')} value={client.company} />
          <Row label={t('Adresse')} value={[client.address, client.city].filter(Boolean).join(', ')} /><Row label={t('Nationalité')} value={client.nationality} />
          <Row label={t("Pièce d'identité")} value={client.id_document_number && `${client.id_document_type || ''} ${client.id_document_number}`} />
          {client.notes && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{client.notes}</p>}
        </Card>
        <div className="space-y-4 lg:col-span-2">
          <Card title={t('Historique des séjours ({n})', { n: reservations.length })} padded={false}>
            <Table columns={resCols} data={reservations} onRowClick={(r) => navigate(`/reservations/${r._id}`)} emptyMessage={t('Aucune réservation')} className="border-0" />
          </Card>
          <Card title={t('Paiements ({n})', { n: payments.length })} padded={false}>
            <Table className="border-0" data={payments} emptyMessage={t('Aucun paiement')} columns={[
              { key: 'payment_date', label: t('Date'), render: (v) => formatDay(v) },
              { key: 'payment_method', label: t('Mode'), render: (v) => paymentMethodLabel(v) },
              { key: 'type', label: t('Type'), render: (v) => (v === 'refund' ? t('Remboursement') : t('Paiement')) },
              { key: 'amount', label: t('Montant'), align: 'right', render: (v, p) => <b className={p.type === 'refund' ? 'text-red-600' : ''}>{p.type === 'refund' ? '−' : ''}{formatMoney(v)}</b> },
            ]} />
          </Card>
          <Card title={t('Factures ({n})', { n: invoices.length })} padded={false}>
            <Table className="border-0" data={invoices} onRowClick={(i) => navigate(`/invoices/${i._id}`)} emptyMessage={t('Aucune facture')} columns={[
              { key: 'invoice_number', label: t('N°'), render: (v) => <b>{v}</b> },
              { key: 'issue_date', label: t('Date'), render: (v) => formatDay(v) },
              { key: 'status', label: t('Statut'), render: (v) => <StatusBadge status={v} type="invoice" /> },
              { key: 'total_amount', label: t('Total'), align: 'right', render: (v) => formatMoney(v) },
            ]} />
          </Card>
        </div>
      </div>
      <ClientFormModal isOpen={editing} onClose={() => setEditing(false)} client={client} onSaved={reload} />
    </div>
  );
};

export default ClientDetailsPage;
