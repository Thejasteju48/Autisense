const Button = ({ 
  children, 
  variant = 'primary', 
  icon: Icon, 
  iconPosition = 'left',
  className = '',
  ...props 
}) => {
  const baseClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  
  return (
    <button className={`${baseClass} ${Icon ? 'btn-icon' : ''} ${className}`} {...props}>
      {Icon && iconPosition === 'left' && <Icon className="h-5 w-5" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="h-5 w-5" />}
    </button>
  );
};

export default Button;
