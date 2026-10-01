const RoomStatsCard = ({ label, value, badge, badgeClass, meta, metaClass }) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</div>
      <div className="mt-2 flex items-end justify-between">
        <span className={`text-[28px] font-bold ${metaClass || ''}`}>{value}</span>
        {badge && <span className={`rounded-full ${badgeClass} px-2 py-0.5 text-[11px] font-semibold`}>{badge}</span>}
        {meta && <span className={`text-[12px] ${metaClass}`}>{meta}</span>}
      </div>
    </div>
  );
};

export default RoomStatsCard;
