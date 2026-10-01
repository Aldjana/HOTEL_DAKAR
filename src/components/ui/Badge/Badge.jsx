const Badge = ({ children, variant = 'neutral', size = 'md', className = '' }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-[#4caf50] text-white';
      case 'warning':
        return 'bg-[#ff9800] text-white';
      case 'error':
        return 'bg-[#dc3545] text-white';
      case 'info':
        return 'bg-[#2196f3] text-white';
      case 'purple':
        return 'bg-[#7e57c2] text-white';
      default:
        return 'bg-[#6c757d] text-white';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  return (
    <span
      className={`
        inline-block rounded-full font-medium uppercase tracking-wider
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
