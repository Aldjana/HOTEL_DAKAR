const Card = ({ children, title, actions, footer, padded = true, className = '', ...props }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`} {...props}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-200 font-semibold text-lg flex items-center justify-between gap-3">
          <span>{title}</span>
          {actions && <div className="flex items-center gap-2 text-base font-medium">{actions}</div>}
        </div>
      )}
      <div className={padded ? 'p-6' : ''}>{children}</div>
      {footer && <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">{footer}</div>}
    </div>
  );
};

export default Card;
