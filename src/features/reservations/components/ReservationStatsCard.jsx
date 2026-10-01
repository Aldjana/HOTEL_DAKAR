const ReservationStatsCard = ({ icon: Icon, iconBg, iconColor, change, label, value, changeColor }) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-6 flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`text-[13px] font-semibold ${changeColor}`}>{change}</span>
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-2 text-[32px] font-bold leading-none text-slate-800">
        {value}
      </div>
    </div>
  );
};

export default ReservationStatsCard;
