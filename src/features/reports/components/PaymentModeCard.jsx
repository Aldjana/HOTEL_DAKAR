const PaymentModeCard = ({ l, v, p, c }) => {
  return (
    <div className={`rounded-xl border border-slate-100 border-l-4 bg-slate-50 p-3 ${c}`}>
      <div className="text-[11px] font-semibold uppercase text-slate-400">{l}</div>
      <div className="mt-1 text-[22px] font-bold">{v}</div>
      <div className="text-[11px] text-slate-400">{p}</div>
    </div>
  );
};

export default PaymentModeCard;
