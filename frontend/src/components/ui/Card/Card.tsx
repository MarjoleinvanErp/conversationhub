// ConversationHub - Modern Card Component
// Flexible container component voor Nederlandse overheid design

import React from 'react';
import type { CardProps } from '../types';

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  testId,
  ...props
}) => {
  // Base card styles
  const baseStyles = 'bg-white rounded-xl transition-all duration-300';
  
  // Variant styles
  const variantStyles = {
    default: 'border border-slate-200 shadow-soft',
    elevated: 'shadow-medium hover:shadow-large transform hover:-translate-y-0.5',
    outlined: 'border-2 border-slate-300 shadow-none hover:border-blue-300'
  };
  
  // Padding styles
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  // Combine all styles
  const combinedStyles = [
    baseStyles,
    variantStyles[variant],
    paddingStyles[padding],
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div
      className={combinedStyles}
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;