// Color configuration utility
export const getColorConfig = () => ({
  primary: {
    main: import.meta.env.VITE_PRIMARY_COLOR || '#2563eb',
    hover: import.meta.env.VITE_PRIMARY_HOVER || '#1d4ed8',
    light: '#dbeafe',
    lighter: '#eff6ff'
  },
  secondary: {
    main: import.meta.env.VITE_SECONDARY_COLOR || '#10b981',
    hover: import.meta.env.VITE_SECONDARY_HOVER || '#059669',
    light: '#d1fae5',
    lighter: '#ecfdf5'
  },
  danger: {
    main: import.meta.env.VITE_DANGER_COLOR || '#ef4444',
    hover: import.meta.env.VITE_DANGER_HOVER || '#dc2626',
    light: '#fecaca',
    lighter: '#fef2f2'
  },
  warning: {
    main: import.meta.env.VITE_WARNING_COLOR || '#f59e0b',
    hover: import.meta.env.VITE_WARNING_HOVER || '#d97706',
    light: '#fed7aa',
    lighter: '#fffbeb'
  },
  success: {
    main: import.meta.env.VITE_SUCCESS_COLOR || '#10b981',
    hover: import.meta.env.VITE_SUCCESS_HOVER || '#059669',
    light: '#d1fae5',
    lighter: '#ecfdf5'
  },
  neutral: {
    main: import.meta.env.VITE_NEUTRAL_COLOR || '#6b7280',
    hover: import.meta.env.VITE_NEUTRAL_HOVER || '#4b5563',
    light: '#f3f4f6',
    lighter: '#f9fafb'
  }
});

// CSS Custom Properties Generator
export const generateColorCSS = () => {
  const colors = getColorConfig();
  let css = ':root {\n';
  
  Object.entries(colors).forEach(([name, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      css += `  --color-${name}-${shade}: ${value};\n`;
    });
  });
  
  css += '}\n';
  return css;
};