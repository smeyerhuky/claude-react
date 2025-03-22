import React, { memo } from 'react';

/**
 * Reusable Button component with various styling options
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {string} props.variant - Styling variant (default, primary, danger, success, active)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {string} props.type - HTML button type
 * @param {boolean} props.fullWidth - Whether button spans full width
 * @returns {JSX.Element} - Button component
 */
const Button = memo(({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  variant = 'default', // default, primary, danger, success, active
  size = 'md', // sm, md, lg
  type = 'button',
  fullWidth = false,
  ...props 
}) => {
  const baseClasses = 'rounded focus:outline-none transition-colors';
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  const variantClasses = {
    default: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    active: 'bg-blue-500 text-white',
  };
  
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  
  const buttonClasses = `
    ${baseClasses} 
    ${sizeClasses[size]} 
    ${variantClasses[variant]} 
    ${disabled ? disabledClasses : ''}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;