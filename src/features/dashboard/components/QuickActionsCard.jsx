import { CreditCard, LogIn, LogOut, Plus, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES, reservationPath } from '../../../constants/routes';
import { useT } from '../../../i18n';

const QuickActionsCard = ({ arrivals = [], departures = [] }) => {
  const { t } = useT();
  const { can } = useAuth();
  const nextArrival = arrivals.find((r) => r.status !== 'checked_in');
  const nextDeparture = departures.find((r) => r.status === 'checked_in');

  const outlineActions = [
    can('payments.read') && { label: t('Enregistrer un paiement'), route: ROUTES.PAYMENTS, icon: CreditCard },
    can('reservations.write') && { label: t('Faire un check-in'), route: nextArrival ? reservationPath(nextArrival._id, 'check-in') : ROUTES.RESERVATIONS, icon: LogIn },
    can('reservations.write') && { label: t('Faire un check-out'), route: nextDeparture ? reservationPath(nextDeparture._id, 'check-out') : ROUTES.RESERVATIONS, icon: LogOut },
    can('cash.read') && { label: t('Voir la caisse'), route: ROUTES.CASH, icon: User },
  ].filter(Boolean);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="mb-4 mt-1 px-1 text-[16px] font-semibold text-slate-800">{t('Actions rapides')}</h2>

      <div className="space-y-3">
        {can('reservations.write') && (
          <Link
            to={ROUTES.NEW_RESERVATION}
            className="flex w-full items-center gap-3 rounded-xl bg-[#0D1520] px-4 py-3 text-[14px] font-semibold text-white no-underline shadow-sm hover:bg-[#152536]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30">
              <Plus className="h-3.5 w-3.5" />
            </span>
            {t('Nouvelle réservation')}
          </Link>
        )}

        {outlineActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.route}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-700 no-underline transition hover:bg-slate-50"
            >
              <Icon className="h-4 w-4 text-slate-500" />
              {action.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default QuickActionsCard;
