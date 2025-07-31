// ConversationHub - Modern Loading Spinner Component
// Accessible loading indicator voor Nederlandse overheid

import React from 'react';
import type { LoadingSpinnerProps } from '../types';

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  testId,
  children,
  ...props
}) => {
  // Size styles
  const sizeStyles = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };
  
  // Color styles
  const colorStyles = {
    primary: 'text-blue-600',
    secondary: 'text-emerald-600',
    neutral: 'text-gray-600'
  };
  
  // Combine styles for spinner
  const spinnerStyles = [
    'animate-spin',
    sizeStyles[size],
    colorStyles[color],
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      className="flex items-center justify-center"
      data-testid={testId}
      {...props}
    >
      <svg
        className={spinnerStyles}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="img"
        aria-label="Loading"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {children && (
        <span className="ml-2 text-sm text-gray-600">
          {children}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;