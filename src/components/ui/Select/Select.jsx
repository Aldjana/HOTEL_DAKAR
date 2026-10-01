const Select = ({
  label,
  error,
  helperText,
  options = [],
  value,
  onChange,
  className = '',
  containerClassName = '',
  children,
  ...props
}) => {
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label className="block mb-2 font-medium text-gray-700 text-sm">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className={`
          w-full px-2.5 py-1.5 border rounded text-base bg-white transition-colors
          ${error ? 'border-red-500' : 'border-gray-300'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${className}
        `}
        {...props}
      >
        {children || options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="block mt-1 text-red-500 text-xs">{error}</span>}
      {helperText && !error && <span className="block mt-1 text-gray-600 text-xs">{helperText}</span>}
    </div>
  );
};

export default Select;
