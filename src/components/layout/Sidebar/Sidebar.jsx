import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Bed, Broom, Calendar, ClipboardList, CreditCard, FileText, LayoutDashboard, LogOut, Settings, Users, Wallet, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { ROUTES } from '../../../constants/routes';
import { ROLE_LABELS } from '../../../utils/permissions';
import { useT } from '../../../i18n';

const menuItems = [
  { path: ROUTES.DASHBOARD, label: 'Tableau de bord', icon: LayoutDashboard, permission: 'dashboard.read', hideFor: ['housekeeping'] },
  { path: ROUTES.PLANNING, label: 'Planning', icon: Calendar, permission: 'planning.read' },
  { path: ROUTES.RESERVATIONS, label: 'Réservations', icon: ClipboardList, permission: 'reservations.read' },
  { path: ROUTES.ROOMS, label: 'Chambres', icon: Bed, permission: 'rooms.read' },
  { path: ROUTES.CLIENTS, label: 'Clients', icon: Users, permission: 'clients.read' },
  { path: ROUTES.PAYMENTS, label: 'Paiements', icon: CreditCard, permission: 'payments.read' },
  { path: ROUTES.CASH, label: 'Caisse', icon: Wallet, permission: 'cash.read' },
  { path: ROUTES.INVOICES, label: 'Factures', icon: FileText, permission: 'invoices.read' },
  { path: ROUTES.HOUSEKEEPING, label: 'Ménage', icon: Broom, permission: 'housekeeping.read' },
  { path: ROUTES.REPORTS, label: 'Rapports', icon: BarChart3, permission: 'reports.read' },
  { path: ROUTES.SETTINGS, label: 'Paramètres', icon: Settings, permission: 'settings.update' },
];

const Sidebar = ({ open, onClose }) => {
  const { t } = useT();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, can } = useAuth();
  const { hotelName } = useApp();

  const handleLogout = async () => { await logout(); navigate(ROUTES.LOGIN, { replace: true }); };
  const items = menuItems.filter((i) => can(i.permission) && !(i.hideFor || []).includes(user?.role));

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 xl:hidden" onClick={onClose} />}
      <aside className={`fixed left-0 top-0 z-40 flex h-screen w-[248px] flex-col bg-[#0D1520] text-white transition-transform xl:z-20 xl:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-start justify-between gap-3 px-5 py-5">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="m-0 text-[18px] font-bold leading-snug text-white">{hotelName}</h2>
              <p className="mt-1 text-[12px] text-slate-400">SaaS PMS</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 xl:hidden" aria-label={t('Fermer le menu')}><X className="h-5 w-5" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="m-0 list-none p-0">
            {items.map((item) => {
              const active = item.path === ROUTES.DASHBOARD ? pathname === '/' : pathname === item.path || pathname.startsWith(`${item.path}/`);
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link to={item.path} className={`relative flex items-center gap-3 px-5 py-2.5 text-[14px] font-medium no-underline transition-colors ${active ? 'bg-[#152536] text-[#10B981]' : 'text-slate-400 hover:bg-[#122231] hover:text-slate-200'}`}>
                    {active && <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r-full bg-[#10B981]" />}
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-[#10B981]' : 'text-slate-400'}`} />
                    <span>{t(item.label)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-sm font-bold text-[#0D1520]">{(user?.first_name?.[0] || 'U').toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[14px] font-semibold text-white">{user?.first_name || user?.email}</p>
              <p className="m-0 text-[12px] text-slate-400">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
            <button type="button" onClick={handleLogout} title={t('Déconnexion')} aria-label={t('Déconnexion')} className="border-0 bg-transparent p-1 text-slate-400 hover:text-white"><LogOut className="h-[18px] w-[18px]" /></button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
