const Input = ({
  label,
  error,
  helperText,
  value,
  onChange,
  multiline = false,
  rows = 3,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label className="block mb-2 font-medium text-gray-700 text-sm">{label}</label>}
      <InputComponent
        value={value}
        onChange={onChange}
        rows={multiline ? rows : undefined}
        className={`
          w-full px-2.5 py-1.5 border rounded text-base transition-colors
          ${multiline ? 'min-h-[80px] resize-vertical' : ''}
          ${error ? 'border-red-500' : 'border-gray-300'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${className}
        `}
        {...props}
      />
      {error && <span className="block mt-1 text-red-500 text-xs">{error}</span>}
      {helperText && !error && <span className="block mt-1 text-gray-600 text-xs">{helperText}</span>}
    </div>
  );
};

export default Input;
