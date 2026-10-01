const CLS = 'mt-1 w-full rounded-lg border border-slate-200 px-3 text-[13px] font-medium normal-case tracking-normal text-slate-800';

// Champ d'origine : libellé en capitales + input h-11.
const Field = ({ label, multiline, rows = 3, className = '', ...props }) => (
  <label className={`text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 ${className}`}>
    {label}
    {multiline ? <textarea rows={rows} className={`${CLS} py-2`} {...props} /> : <input className={`${CLS} h-11`} {...props} />}
  </label>
);

export default Field;
