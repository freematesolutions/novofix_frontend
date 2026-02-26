import { HiCheckCircle, HiExclamation, HiExclamationCircle, HiInformationCircle } from 'react-icons/hi';

function variantClasses(type) {
  switch (type) {
    case 'success':
      return {
        container: 'border-green-200 bg-green-50/80 text-green-800',
        icon: HiCheckCircle,
        iconColor: 'text-green-500'
      };
    case 'error':
      return {
        container: 'border-red-200 bg-red-50/80 text-red-800',
        icon: HiExclamationCircle,
        iconColor: 'text-red-500'
      };
    case 'warning':
      return {
        container: 'border-amber-200 bg-amber-50/80 text-amber-800',
        icon: HiExclamation,
        iconColor: 'text-amber-500'
      };
    default:
      return {
        container: 'border-brand-200 bg-brand-50/80 text-brand-800',
        icon: HiInformationCircle,
        iconColor: 'text-brand-500'
      };
  }
}

function Alert({ type = 'info', title, children, className = '' }) {
  const variant = variantClasses(type);
  const IconComponent = variant.icon;
  
  return (
    <div 
      className={`rounded-xl border px-4 py-3 text-sm backdrop-blur-xs ${variant.container} ${className}`} 
      role="alert"
    >
      <div className="flex items-start gap-3">
        <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${variant.iconColor}`} aria-hidden />
        <div className="flex-1 min-w-0">
          {title && <div className="font-semibold mb-1">{title}</div>}
          {typeof children === 'string' ? <div className="text-sm">{children}</div> : children}
        </div>
      </div>
    </div>
  );
}

export default Alert;
