import Spinner from './Spinner.jsx';
import { useAuth } from '@/state/AuthContext.jsx';

function Button({
  children,
  loading = false,
  disabled,
  variant = 'primary',
  className = '',
  ...props
}) {
  const { role, viewRole } = useAuth();
  const r = role === 'guest' ? 'guest' : viewRole;
  const accent = (() => {
    switch (r) {
      case 'provider':
        return { bg600: 'bg-brand-600', hoverBg700: 'hover:bg-brand-700', ring500: 'focus:ring-brand-500', text600: 'text-brand-600' };
      case 'client':
        return { bg600: 'bg-accent-600', hoverBg700: 'hover:bg-accent-700', ring500: 'focus:ring-accent-500', text600: 'text-accent-600' };
      case 'admin':
        return { bg600: 'bg-dark-600', hoverBg700: 'hover:bg-dark-700', ring500: 'focus:ring-dark-500', text600: 'text-dark-600' };
      default:
        return { bg600: 'bg-brand-600', hoverBg700: 'hover:bg-brand-700', ring500: 'focus:ring-brand-500', text600: 'text-brand-600' };
    }
  })();

  const base = 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 disabled:opacity-75 disabled:cursor-not-allowed';
  const styles = {
    primary: `text-white ${accent.bg600} ${accent.hoverBg700} ${accent.ring500}`,
    secondary: 'text-gray-800 bg-gray-100 hover:bg-gray-200',
    ghost: 'text-gray-700 hover:bg-gray-100'
  };
  const cls = `${base} ${styles[variant] ?? styles.primary} ${className}`;

  return (
    <button className={cls} disabled={disabled || loading} {...props}>
      {loading && <Spinner size={16} />}
      <span className={loading ? 'ml-2' : ''}>{children}</span>
    </button>
  );
}

export default Button;
