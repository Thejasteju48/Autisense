const Input = ({ 
  label, 
  type = 'text', 
  error,
  helpText,
  required = false,
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
      <input 
        type={type}
        className={`input-field ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helpText && !error && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
  );
};

export default Input;
