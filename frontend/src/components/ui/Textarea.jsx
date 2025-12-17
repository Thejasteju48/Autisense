const Textarea = ({ 
  label, 
  error,
  helpText,
  maxLength,
  value = '',
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
      <textarea 
        className={`input-field resize-none ${error ? 'border-red-500' : ''} ${className}`}
        value={value}
        {...props}
      />
      {maxLength && (
        <p className="mt-1 text-xs text-gray-500">
          {value.length}/{maxLength} characters
        </p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helpText && !error && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
  );
};

export default Textarea;
