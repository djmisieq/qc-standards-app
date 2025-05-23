import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'filled' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'filled',
  size = 'medium',
  isLoading = false,
  className = '',
  ...props
}) => {
  // Base styles
  let baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
  
  // Variant styles
  let variantClasses = '';
  switch (variant) {
    case 'filled':
      variantClasses = 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800';
      break;
    case 'outlined':
      variantClasses = 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100';
      break;
    case 'text':
      variantClasses = 'bg-transparent text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100';
      break;
  }
  
  // Size styles
  let sizeClasses = '';
  switch (size) {
    case 'small':
      sizeClasses = 'text-xs py-1 px-3';
      break;
    case 'medium':
      sizeClasses = 'text-sm py-2 px-4';
      break;
    case 'large':
      sizeClasses = 'text-base py-3 px-6';
      break;
  }
  
  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
