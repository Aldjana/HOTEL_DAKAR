const CLS = 'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-[13px] font-medium normal-case tracking-normal text-slate-700';

export const ReportFilterSelector = ({ label, value, onChange, children }) => {
  return (
    <label className="min-w-[140px] flex-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
      {label}
      <select value={value} onChange={onChange} className={CLS}>{children}</select>
    </label>
  );
};

export const ReportFilterDate = ({ label, value, onChange, min, max }) => {
  return (
    <label className="min-w-[140px] flex-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
      {label}
      <input type="date" value={value} min={min} max={max} onChange={onChange} className={CLS} />
    </label>
  );
};

export default ReportFilterSelector;
