import { CreditCard, Radio, Smartphone, Wallet } from 'lucide-react';

const ICON_MAP = {
  Wallet,
  Radio,
  Smartphone,
  CreditCard,
};

const PaymentMethodCard = ({ label, value, icon, bar }) => {
  const Icon = ICON_MAP[icon];

  return (
    <div className="min-w-[140px] rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {Icon && <Icon className="h-4 w-4" />} {label}
      </div>
      <div className="mt-3 text-[22px] font-bold">{value}</div>
      {bar && <div className={`mt-3 h-1.5 rounded-full ${bar}`} />}
    </div>
  );
};

export default PaymentMethodCard;
