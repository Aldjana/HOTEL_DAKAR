import { useState } from 'react';
import { formatMoney } from '../../../utils/format';
import { tr } from '../../../i18n';

const MONTHS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];
const dayLabel = (d) => `${d.slice(8)} ${tr(MONTHS[Number(d.slice(5, 7)) - 1])}`;

// series : [{ date: 'YYYY-MM-DD', amount }] ; today : 'YYYY-MM-DD' (les jours futurs sont « prévisionnel »)
const RevenueChart = ({ series = [], today }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const max = Math.max(...series.map((s) => s.amount), 0) || 1;
  const step = Math.max(1, Math.ceil(series.length / 8));
  const data = series.map((s, i) => ({
    day: i % step === 0 || i === series.length - 1 ? dayLabel(s.date) : '',
    full: dayLabel(s.date),
    amount: s.amount,
    val: Math.max((s.amount / max) * 100, 2),
    type: s.date > today ? 'forecast' : s.amount > 0 ? 'real' : 'past',
  }));
  const TYPE_LABEL = { real: tr('Réel'), forecast: tr('Prévisionnel'), past: tr('Aucun encaissement') };

  return (
    <div className="relative h-64 w-full flex flex-col justify-between pt-4">
      {/* Lignes de grille horizontales */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
        <div className="border-b border-slate-100 w-full h-0"></div>
        <div className="border-b border-slate-100 w-full h-0"></div>
        <div className="border-b border-slate-100 w-full h-0"></div>
        <div className="border-b border-slate-100 w-full h-0"></div>
      </div>

      {/* Barres du graphique */}
      <div className={`relative z-10 h-52 flex items-end justify-between px-2 ${data.length > 45 ? 'gap-px' : 'gap-1.5'}`}>
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end relative">
            <div
              style={{ height: `${item.val}%` }}
              className={`w-full rounded-t-sm transition-all relative cursor-pointer hover:opacity-80 ${
                item.type === 'real'
                  ? 'bg-[#006C49]'
                  : item.type === 'forecast'
                  ? 'bg-slate-300/80 border-t-2 border-dashed border-slate-700'
                  : 'bg-slate-200/80'
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
      <div className="relative z-10 flex justify-between text-[9px] font-semibold uppercase text-slate-500 pt-2 px-1">
        {data.map((item, idx) => (
          <div key={idx} className="relative h-4 flex-1 text-center">
            <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueChart;
