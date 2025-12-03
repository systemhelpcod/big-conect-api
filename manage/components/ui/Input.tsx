import React, { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  icon, 
  rightElement, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-gray-400 mb-1 ml-1">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#00A884] transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-[#202C33] text-[#E9EDEF] border border-[#2A3942] rounded-lg 
            ${icon ? 'pl-10' : 'pl-4'} ${rightElement ? 'pr-12' : 'pr-4'} py-3
            focus:outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884]
            placeholder-gray-600 transition-all duration-200
            ${error ? 'border-[#F15C6D] focus:border-[#F15C6D] focus:ring-[#F15C6D]' : ''}
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-[#F15C6D] ml-1 animate-pulse">
          {error}
        </p>
      )}
    </div>
  );
};