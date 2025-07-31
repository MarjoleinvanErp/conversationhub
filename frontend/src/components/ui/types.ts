// ConversationHub UI Components - Type Definitions
// Modern TypeScript React Component Props

import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// Base Props voor alle UI componenten
export interface BaseUIProps {
  className?: string;
  testId?: string;
  children?: ReactNode;
}

// Button Component Props
export interface ButtonProps extends BaseUIProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: 'primary' | 'secondary' | 'neutral' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

// Input Component Props
export interface InputProps extends BaseUIProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Card Component Props
export interface CardProps extends BaseUIProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// Badge Component Props
export interface BadgeProps extends BaseUIProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

// Modal Component Props
export interface ModalProps extends BaseUIProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
}

// Alert Component Props
export interface AlertProps extends BaseUIProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

// Loading Spinner Props
export interface LoadingSpinnerProps extends BaseUIProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'neutral';
}