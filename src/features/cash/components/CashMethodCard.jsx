const CashMethodCard = ({ label, value, suffix }) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</div>
      <div className="mt-3 text-[22px] font-bold leading-none">{value}</div>
      <div className="mt-1 text-[11px] text-slate-400">{suffix || 'FCFA'}</div>
    </div>
  );
};

export default CashMethodCard;
