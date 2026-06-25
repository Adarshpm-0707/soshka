import React from 'react';

const Input = ({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  required = false,
  disabled = false,
  className = '',
  rows = 4, // for textarea
  ...props
}) => {
  const inputStyles = `w-full px-4 py-2.5 rounded-lg border text-sm transition-colors duration-200 outline-none
    ${disabled ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' : ''}
    ${error 
      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10' 
      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400'
    }
  `;

  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          id={id}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={inputStyles}
          {...props}
        />
      ) : (
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={inputStyles}
          {...props}
        />
      )}

      {error && (
        <span className="text-xs font-medium text-red-500 animate-fade-in">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
