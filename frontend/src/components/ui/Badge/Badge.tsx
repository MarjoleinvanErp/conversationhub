// ConversationHub - Modern Badge Component
// Status indicators voor Nederlandse overheid applicaties

import React from 'react';
import type { BadgeProps } from '../types';

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  testId,
  ...props
}) => {
  // Base badge styles
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  
  // Variant styles - Nederlandse overheid status kleuren
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800', 
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };
  
  // Size styles
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  };
  
  // Combine all styles
  const combinedStyles = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className
  ].filter(Boolean).join(' ');
  
  return (
    <span
      className={combinedStyles}
      data-testid={testId}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;