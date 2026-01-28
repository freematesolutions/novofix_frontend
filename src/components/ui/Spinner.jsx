import { useTranslation } from 'react-i18next';

function Spinner({ size = 'md', color = 'text-brand-600', className = '' }) {
  const { t } = useTranslation();
  const sizeClasses = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-3'
  };
  
  const sizeClass = typeof size === 'string' ? (sizeClasses[size] || sizeClasses.md) : '';
  const customStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : {};
  
  return (
    <span
      className={`inline-block align-middle animate-spin rounded-full border-current border-t-transparent ${color} ${sizeClass} ${className}`}
      style={customStyle}
      role="status"
      aria-label={t('common.loading')}
    >
      <span className="sr-only">{t('common.loading')}</span>
    </span>
  );
}

export default Spinner;
