import { useState } from 'react';
import { formatMoney } from '../../../utils/format';
import { tr } from '../../../i18n';

const MONTHS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];
const dayLabel = (d) => `${d.slice(8)} ${tr(MONTHS[Number(d.slice(5, 7)) - 1])}`;

// Libellés de l'axe X : 1er jour, tous les 5 jours puis dernier jour (01, 05, 10 … 25, 28) ;
// au-delà d'un mois, environ 8 libellés répartis.
const showLabel = (i, n) => {
  if (i === 0 || i === n - 1) return true;
  if (n > 31) return i % Math.ceil(n / 8) === 0 && n - 1 - i >= 2;
  return (i + 1) % 5 === 0 && n - 1 - i >= 2;
};

// series : [{ date: 'YYYY-MM-DD', amount }] encaissé ; forecast : jours futurs prévisionnels (même format).
// today : 'YYYY-MM-DD' (les jours après aujourd'hui sont « prévisionnel »).
const RevenueChart = ({ series = [], forecast = [], today }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const known = new Set(series.map((s) => s.date));
  const all = [...series, ...forecast.filter((f) => !known.has(f.date))].sort((a, b) => a.date.localeCompare(b.date));
  const max = Math.max(...all.map((s) => s.amount), 0) || 1;
  const data = all.map((s, i) => ({
    day: showLabel(i, all.length) ? dayLabel(s.date) : '',
    full: dayLabel(s.date),
    amount: s.amount,
    val: Math.max((s.amount / max) * 100, 2),
    type: s.date > today ? 'forecast' : s.amount > 0 ? 'real' : 'past',
  }));
  const gap = data.length > 45 ? 'gap-px' : data.length > 20 ? 'gap-1' : 'gap-2';
  const TYPE_LABEL = { real: tr('Réel'), forecast: tr('Prévisionnel'), past: tr('Aucun encaissement') };

  return (
    <div className="relative h-64 w-full flex flex-col justify-between pt-4">
      {/* Lignes de grille horizontales */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
        {[0, 1, 2, 3, 4].map((k) => <div key={k} className="border-b border-slate-100 w-full h-0"></div>)}
      </div>

      {/* Barres du graphique */}
      <div className={`relative z-10 h-52 flex items-end justify-between px-2 ${gap}`}>
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 min-w-0 flex flex-col items-center h-full justify-end relative">
            <div
              style={{ height: `${item.val}%` }}
              className={`w-full max-w-[28px] rounded-t-[2px] transition-all relative cursor-pointer hover:opacity-80 ${
                item.type === 'real'
                  ? 'bg-[#006C49]'
                  : item.type === 'forecast'
                  ? 'bg-[#D1D5DB] border-t-2 border-dashed border-slate-800'
                  : 'bg-[#E5E7EB]'
              }`}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            />

            {/* Tooltip */}
            {hoveredIndex === idx && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                <div className="font-semibold">{item.full}</div>
                <div className="text-slate-300">{formatMoney(item.amount)}</div>
                <div className="text-slate-400 capitalize">{TYPE_LABEL[item.type]}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Labels Axe X */}
      <div className={`relative z-10 flex justify-between text-[9px] font-semibold uppercase text-slate-700 pt-2 px-2 ${gap}`}>
        {data.map((item, idx) => (
          <div key={idx} className="relative h-4 flex-1 min-w-0 text-center">
            <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueChart;
