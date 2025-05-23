import React, { InputHTMLAttributes, forwardRef } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  inputClassName?: string;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, helperText, className = '', inputClassName = '', ...props }, ref) => {
    const id = props.id || `input-${props.name || Math.random().toString(36).substring(7)}`;
    
    return (
      <div className={`${className}`}>
        {label && (
          <label htmlFor={id} className="block mb-1 text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          id={id}
          className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} 
                     rounded-md shadow-sm placeholder-gray-400 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     disabled:bg-gray-100 disabled:text-gray-500 ${inputClassName}`}
          {...props}
        />
        
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

TextField.displayName = 'TextField';

export default TextField;
