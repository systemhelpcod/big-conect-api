import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  icon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] text-sm";
  
  const variants = {
    primary: "bg-[#00A884] hover:bg-[#008f6f] text-[#111B21] shadow-lg shadow-[#00A884]/20 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-[#202C33] hover:bg-[#2A3942] text-[#00A884] border border-[#00A884]/30 disabled:opacity-50",
    ghost: "bg-transparent hover:bg-[#202C33] text-gray-400 hover:text-[#E9EDEF]",
    danger: "bg-[#F15C6D]/10 hover:bg-[#F15C6D]/20 text-[#F15C6D] border border-[#F15C6D]/30"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};