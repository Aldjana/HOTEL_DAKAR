const HousekeepingStatsCard = ({ label, value, unit, color, borderClass }) => {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ${borderClass ? `border-l-4 ${borderClass}` : ''}`}>
      <div className="text-[11px] font-semibold uppercase text-slate-400">{label}</div>
      <div className={`mt-2 text-[22px] font-bold ${color}`}>{value} <span className="text-[13px] font-medium text-slate-400">{unit}</span></div>
    </div>
  );
};

export default HousekeepingStatsCard;
