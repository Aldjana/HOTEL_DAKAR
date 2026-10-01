import { Broom, Clock, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { reservationPath } from '../../../constants/routes';
import { useT, tr } from '../../../i18n';

const alertStyles = {
  housekeeping: { card: 'bg-[#fdecee] text-[#c43b4a]', icon: Broom },
  payment: { card: 'bg-[#f8eedd] text-[#c47a12]', icon: Clock },
  maintenance: { card: 'bg-[#eef1f4] text-slate-500', icon: Wrench },
};

const KIND = { overdue_departure: 'payment', late_arrival: 'payment', rooms_to_clean: 'housekeeping', maintenance: 'maintenance' };
const DEFAULT_TITLE = { rooms_to_clean: 'Ménage', maintenance: 'Maintenance' };

// L'API renvoie un message unique « Titre : détail » : on le sépare pour retrouver titre + texte de la maquette.
const splitMessage = (a) => {
  const full = tr(a.message || '');
  const sep = full !== a.message ? ': ' : ' : ';
  const i = full.indexOf(sep);
  if (i > 0) return { title: full.slice(0, i), text: full.slice(i + sep.length) };
  return { title: tr(DEFAULT_TITLE[a.type] || 'Alerte'), text: full };
};

const AlertsPanel = ({ alerts = [] }) => {
  const { t } = useT();
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between px-1">
        <h2 className="m-0 text-[16px] font-semibold text-slate-800">{t('Alertes')}</h2>
        {alerts.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1.5 text-[11px] font-bold text-white">{alerts.length}</span>
        )}
      </div>

      <div className="space-y-3">
        {alerts.length === 0 && <p className="m-0 px-1 text-[12px] text-slate-500">{t('Aucune alerte. Tout est en ordre.')}</p>}
        {alerts.map((alert, i) => {
          const style = alertStyles[KIND[alert.type] || 'maintenance'];
          const Icon = style.icon;
          const { title, text } = splitMessage(alert);
          const body = (
            <>
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="text-[13px] font-semibold text-slate-800">{title}</div>
                <div className="text-[12px] text-slate-500">{text}</div>
              </div>
            </>
          );
          const cls = `flex items-start gap-3 rounded-xl px-3 py-3 ${style.card}`;
          return alert.reservation_id ? (
            <Link key={i} to={reservationPath(alert.reservation_id)} className={`${cls} no-underline`}>{body}</Link>
          ) : <div key={i} className={cls}>{body}</div>;
        })}
      </div>
    </section>
  );
};

export default AlertsPanel;
