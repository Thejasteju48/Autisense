const Select = ({ 
  label, 
  options = [],
  error,
  required = false,
  placeholder = 'Select an option',
  className = '',
  ...props 
}) => {
  return (
    <div>
      {label && (
        <label className="form-label">
          {label} {required && '*'}
        </label>
      )}
      <select 
        className={`input-field ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
