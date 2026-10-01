import { formatMoney } from '../../../utils/format';

const CurrencyDisplay = ({ amount, showColor = true, size = 'md', className = '' }) => {
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';
  const colorClass = !showColor ? '' : amount >= 0 ? 'text-[#4caf50]' : 'text-[#dc3545]';
  return <span className={`font-semibold ${sizeClass} ${colorClass} ${className}`}>{formatMoney(amount)}</span>;
};

export default CurrencyDisplay;
