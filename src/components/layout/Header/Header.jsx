import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronLeft, Menu, Plus, Search } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { usePageMeta } from '../../../context/PageMetaContext';
import { ROUTES } from '../../../constants/routes';
import { dashboardApi } from '../../../services/api/dashboardApi';
import { authApi } from '../../../services/api/authApi';
import { tokens } from '../../../services/storage/authTokens';
import { getErrorMessage } from '../../../services/api/client';
import { ROLE_LABELS } from '../../../utils/permissions';
import { fullName, formatDayLong, todayStr } from '../../../utils/format';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button/Button';
import Input from '../../ui/Input/Input';
import { useToast } from '../../feedback/ToastProvider';
import { useT, tr } from '../../../i18n';


const AlertsBell = () => {
  const { t } = useT();
  const { can } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const allowed = can('dashboard.read');

  useEffect(() => {
    if (!allowed) return undefined;
    let alive = true;
    const load = () => dashboardApi.statistics().then((d) => alive && setAlerts(d.alerts || [])).catch(() => {});
    load();
    const t = setInterval(load, 120000);
    return () => { alive = false; clearInterval(t); };
  }, [allowed]);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!allowed) return null;
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50" aria-label={t('Notifications')}>
        <Bell className="h-5 w-5" />
        {alerts.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ef4444]" />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <p className="m-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t('Alertes')}</p>
          {alerts.length === 0 ? <p className="m-0 px-3 py-4 text-sm text-slate-500">{t('Aucune alerte en cours.')}</p> : alerts.map((a, i) => (
            <button key={i} type="button" onClick={() => { setOpen(false); if (a.reservation_id) navigate(`/reservations/${a.reservation_id}`); else if (a.type === 'rooms_to_clean') navigate('/housekeeping'); else navigate('/rooms'); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">{tr(a.message)}</button>
          ))}
        </div>
      )}
    </div>
  );
};

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { t } = useT();
  const toast = useToast();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.new_password.length < 8) return setError(t('Le nouveau mot de passe doit comporter au moins 8 caractères'));
    if (form.new_password !== form.confirm) return setError(t('Les deux mots de passe ne correspondent pas'));
    setSaving(true);
    try {
      const res = await authApi.changePassword({ current_password: form.current_password, new_password: form.new_password });
      tokens.set({ token: res.token });
      toast.success(t('Mot de passe modifié'));
      setForm({ current_password: '', new_password: '', confirm: '' });
      onClose();
    } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('Changer mon mot de passe')} size="sm">
      <form onSubmit={submit}>
        {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Input label={t('Mot de passe actuel')} type="password" required autoComplete="current-password" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} />
        <Input label={t('Nouveau mot de passe')} type="password" required autoComplete="new-password" helperText={t('8 caractères minimum')} value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} />
        <Input label={t('Confirmer le nouveau mot de passe')} type="password" required autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>{t('Annuler')}</Button><Button type="submit" loading={saving}>{t('Enregistrer')}</Button></div>
      </form>
    </Modal>
  );
};

const Initials = ({ user }) => `${(user?.first_name?.[0] || '?').toUpperCase()}${(user?.last_name?.[0] || '').toUpperCase()}`;

// Photo uniquement si l'utilisateur en a une ; sinon ses initiales (jamais une photo d'un autre).
const Avatar36 = ({ user }) => {
  const [broken, setBroken] = useState(false);
  return (
    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-[12px] font-bold text-slate-600">
      {user?.avatar_url && !broken ? <img src={user.avatar_url} alt={user?.first_name || ''} className="h-full w-full object-cover" onError={() => setBroken(true)} /> : <Initials user={user} />}
    </div>
  );
};

const UserChip = ({ user, role, onClick }) => {
  const { t } = useT();
  return (
  <button type="button" onClick={onClick} title={t('Changer mon mot de passe')} className="flex items-center gap-3 border-0 bg-transparent p-0">
    <div className="hidden text-right md:block">
      <div className="text-[12px] font-semibold text-slate-700">{fullName(user)}</div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{role || ROLE_LABELS[user?.role]}</div>
    </div>
    <Avatar36 user={user} />
  </button>
  );
};

const NewReservationButton = ({ className = 'bg-[#0D1520] hover:bg-[#152536] text-white' }) => {
  const { t } = useT();
  const { can } = useAuth();
  if (!can('reservations.write')) return null;
  return (
    <Link to={ROUTES.NEW_RESERVATION} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-semibold no-underline shadow-sm sm:px-4 ${className}`} aria-label={t('Nouvelle réservation')}>
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">{t('Nouvelle réservation')}</span>
    </Link>
  );
};

const shell = 'sticky top-0 z-10 flex items-center justify-between gap-3 bg-[#f4f7f9] px-4 py-3 sm:px-6 lg:px-8';

const Header = ({ onMenu }) => {
  const { t } = useT();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hotelName } = useApp();
  const { meta } = usePageMeta();
  const [params, setParams] = useSearchParams();
  const [pwdOpen, setPwdOpen] = useState(false);

  const chip = <UserChip user={user} onClick={() => setPwdOpen(true)} />;
  const menuBtn = (
    <button type="button" onClick={onMenu} className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 xl:hidden" aria-label={t('Ouvrir le menu')}><Menu className="h-5 w-5" /></button>
  );
  const right = (withButton, btnClass) => (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      {withButton && <NewReservationButton className={btnClass} />}
      
      <AlertsBell />
      {chip}
    </div>
  );
  const wrap = (node) => <>{node}<ChangePasswordModal isOpen={pwdOpen} onClose={() => setPwdOpen(false)} /></>;
  const h1 = (cls, text) => <h1 className={`m-0 truncate font-semibold text-slate-800 ${cls}`}>{text}</h1>;

  let content;
  if (pathname === '/') {
    content = (
      <header className={`${shell} lg:pt-6`}>
        <div className="flex min-w-0 items-center">{menuBtn}<h1 className="m-0 truncate text-[18px] font-semibold tracking-tight sm:text-[22px] text-slate-800">{t('Tableau de bord')}</h1></div>
        {right(true)}
      </header>
    );
  } else if (pathname === ROUTES.NEW_RESERVATION) {
    content = (
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {menuBtn}
          <button type="button" onClick={() => navigate(ROUTES.RESERVATIONS)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50" aria-label={t('Retour')}><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="m-0 text-[18px] font-semibold text-slate-800">{t('Nouvelle réservation')}</h1>
        </div>
        {right(false)}
      </header>
    );
  } else if (pathname.endsWith('/check-in') || pathname.endsWith('/check-out')) {
    content = (
      <header className={shell}>
        <div className="flex min-w-0 items-center">{menuBtn}{h1('text-[18px]', pathname.endsWith('/check-in') ? t('Arrivée Client (Check-in)') : t('Check-out Client'))}</div>
        {right(false)}
      </header>
    );
  } else if (pathname.startsWith('/reservations/')) {
    content = (
      <header className={shell}>
        <div className="flex min-w-0 items-center">{menuBtn}<h1 className="m-0 text-[18px] font-semibold text-slate-800">{t('Réservation')} <span className="text-slate-400">{meta.reservationLabel || ''}</span></h1></div>
        {right(false)}
      </header>
    );
  } else if (pathname === ROUTES.ROOMS) {
    content = <header className={shell}><div className="flex min-w-0 items-center">{menuBtn}{h1('text-[16px]', hotelName)}</div>{right(true)}</header>;
  } else if (pathname === ROUTES.CLIENTS) {
    content = (
      <header className={shell}>
        <div className="flex min-w-0 items-center">{menuBtn}{h1('text-[16px]', hotelName)}</div>
        <div className="flex items-center gap-3">
          <div className="relative hidden w-64 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder={t('Rechercher...')}
              value={params.get('q') || ''}
              onChange={(e) => { const n = new URLSearchParams(params); if (e.target.value) n.set('q', e.target.value); else n.delete('q'); setParams(n, { replace: true }); }}
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-[13px] outline-none"
            />
          </div>
          
          <AlertsBell />
          {chip}
        </div>
      </header>
    );
  } else if (pathname === ROUTES.CASH) {
    content = (
      <header className={shell}>
        <div className="flex min-w-0 items-center">{menuBtn}<div className="min-w-0"><h1 className="m-0 truncate text-[16px] font-semibold text-slate-800">{t('Caisse journalière')}</h1><p className="m-0 text-[12px] text-slate-400">{formatDayLong(todayStr())}</p></div></div>
        {right(true)}
      </header>
    );
  } else if (pathname === ROUTES.PAYMENTS) {
    content = <header className={shell}><div className="flex min-w-0 items-center">{menuBtn}{h1('text-[18px]', t('Paiements'))}</div>{right(true, 'bg-[#10B981] text-white hover:bg-[#0ea371]')}</header>;
  } else if (pathname === ROUTES.HOUSEKEEPING) {
    content = (
      <header className={shell}>
        <div className="flex items-center gap-3 text-[15px]">{menuBtn}<span className="font-semibold text-slate-800">{t('Ménage')}</span><span className="text-slate-300">|</span><span className="hidden text-slate-400 sm:inline">{t('Suivez les chambres à nettoyer et à préparer')}</span></div>
        {right(true)}
      </header>
    );
  } else if (pathname === ROUTES.REPORTS || pathname === ROUTES.SETTINGS) {
    content = <header className={shell}><div className="flex min-w-0 items-center">{menuBtn}{h1('text-[18px]', pathname === ROUTES.SETTINGS ? t('Paramètres') : t('Rapports'))}</div>{right(true)}</header>;
  } else {
    const titles = { [ROUTES.PLANNING]: t('Planning des chambres'), [ROUTES.RESERVATIONS]: t('Réservations'), [ROUTES.INVOICES]: t('Factures') };
    content = (
      <header className={shell}>
        <div className="w-10">{menuBtn}</div>
        {h1('text-[16px]', titles[pathname] || '')}
        <div className="flex items-center gap-1 sm:gap-3"><AlertsBell />{chip}</div>
      </header>
    );
  }
  return wrap(content);
};

export default Header;
