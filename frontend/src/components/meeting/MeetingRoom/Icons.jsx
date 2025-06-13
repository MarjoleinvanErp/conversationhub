// Simple icon components
const Icon = ({ children, className = "w-4 h-4" }) => (
  <span className={`inline-block ${className}`} style={{ fontSize: '16px' }}>{children}</span>
);

export const Mic = ({ className }) => <Icon className={className}>🎤</Icon>;
export const Square = ({ className }) => <Icon className={className}>⏹️</Icon>;
export const ChevronDown = ({ className }) => <Icon className={className}>⬇️</Icon>;
export const ChevronUp = ({ className }) => <Icon className={className}>⬆️</Icon>;
export const Trash2 = ({ className }) => <Icon className={className}>🗑️</Icon>;
export const Users = ({ className }) => <Icon className={className}>👥</Icon>;
export const FileText = ({ className }) => <Icon className={className}>📄</Icon>;
export const Settings = ({ className }) => <Icon className={className}>⚙️</Icon>;
export const Download = ({ className }) => <Icon className={className}>⬇️</Icon>;
export const Send = ({ className }) => <Icon className={className}>📤</Icon>;
export const Type = ({ className }) => <Icon className={className}>⌨️</Icon>;
export const Shield = ({ className }) => <Icon className={className}>🛡️</Icon>;
export const Play = ({ className }) => <Icon className={className}>▶️</Icon>;
export const Pause = ({ className }) => <Icon className={className}>⏸️</Icon>;
export const CheckCircle = ({ className }) => <Icon className={className}>✅</Icon>;
export const Calendar = ({ className }) => <Icon className={className}>📅</Icon>;