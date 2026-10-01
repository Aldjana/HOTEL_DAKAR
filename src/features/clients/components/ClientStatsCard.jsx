const ClientStatsCard = ({ label, value, meta, metaClass }) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</div>
      <div className="mt-2 text-[26px] font-bold">{value}</div>
      <div className={`mt-1 text-[12px] ${metaClass}`}>{meta}</div>
    </div>
  );
};

export default ClientStatsCard;
