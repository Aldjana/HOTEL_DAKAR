// Design d'origine (variantes primary / secondary / outline / danger / ghost). 'dark' et 'danger-outline' réutilisent la même palette.
import { useT } from '../../../i18n';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const { t } = useT();
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-[#6c757d] text-white hover:bg-[#5a6268]';
      case 'outline':
        return 'bg-transparent text-[#4caf50] border border-[#4caf50] hover:bg-[#4caf50] hover:text-white';
      case 'danger':
        return 'bg-[#dc3545] text-white hover:bg-[#c82333]';
      case 'danger-outline':
        return 'bg-transparent text-[#dc3545] border border-[#dc3545] hover:bg-[#dc3545] hover:text-white';
      case 'dark':
        return 'bg-[#0D1520] text-white hover:bg-[#152536]';
      case 'ghost':
        return 'bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent';
      default:
        return 'bg-[#4caf50] text-white hover:bg-[#45a049]';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        border-none rounded cursor-pointer font-medium transition-all
        inline-flex items-center justify-center gap-2
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? t('Chargement...') : children}
    </button>
  );
};

export default Button;
