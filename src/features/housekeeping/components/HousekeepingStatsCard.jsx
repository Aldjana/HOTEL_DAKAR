const HousekeepingStatsCard = ({ label, value, unit, color, borderClass, onClick }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} className={`rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''} ${borderClass ? `border-l-4 ${borderClass}` : ''}`}>
      <div className="text-[11px] font-semibold uppercase text-slate-400">{label}</div>
      <div className={`mt-2 text-[22px] font-bold ${color}`}>{value} <span className="text-[13px] font-medium text-slate-400">{unit}</span></div>
    </Tag>
  );
};

export default HousekeepingStatsCard;
