const Avatar = ({ 
  name, 
  image, 
  size = 'md', 
  className = '',
  showStatus = false,
  statusColor = '#4caf50'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'w-6 h-6 text-xs';
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'lg':
        return 'w-12 h-12 text-lg';
      case 'xl':
        return 'w-16 h-16 text-xl';
      default:
        return 'w-10 h-10 text-sm';
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className={`rounded-full bg-[#4caf50] text-white flex items-center justify-center font-bold relative overflow-hidden ${getSizeClasses()} ${className}`}>
      {image ? (
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
      {showStatus && (
        <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: statusColor }} />
      )}
    </div>
  );
};

export default Avatar;
