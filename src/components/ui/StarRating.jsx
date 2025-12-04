import { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';

/**
 * StarRating Component - Componente reutilizable para mostrar y seleccionar ratings
 * Soporta modo readonly (display) y modo interactivo (input)
 * Optimizado para rendimiento con memo y useCallback
 */

// SVG Star Icon optimizado
const StarIcon = memo(({ filled, half, className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="halfStarGradient">
        <stop offset="50%" stopColor="#FBBF24" />
        <stop offset="50%" stopColor="#E5E7EB" />
      </linearGradient>
    </defs>
    <path
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      fill={filled ? 'url(#starGradient)' : half ? 'url(#halfStarGradient)' : '#E5E7EB'}
      stroke={filled || half ? '#F59E0B' : '#D1D5DB'}
      strokeWidth="0.5"
    />
  </svg>
));

StarIcon.displayName = 'StarIcon';

StarIcon.propTypes = {
  filled: PropTypes.bool,
  half: PropTypes.bool,
  className: PropTypes.string
};

// Tamaños predefinidos
const SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10'
};

// Gaps predefinidos
const GAPS = {
  xs: 'gap-0',
  sm: 'gap-0.5',
  md: 'gap-1',
  lg: 'gap-1.5'
};

function StarRating({
  value = 0,
  onChange,
  max = 5,
  size = 'md',
  gap = 'sm',
  readonly = false,
  showValue = false,
  showCount = false,
  count = 0,
  allowHalf = false,
  label = '',
  className = '',
  activeColor = 'text-amber-400',
  inactiveColor = 'text-gray-300',
  hoverColor = 'text-amber-500',
  animated = true
}) {
  const [hoverValue, setHoverValue] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const displayValue = isHovering && !readonly ? hoverValue : value;

  const handleMouseEnter = useCallback((starValue) => {
    if (readonly) return;
    setIsHovering(true);
    setHoverValue(starValue);
  }, [readonly]);

  const handleMouseLeave = useCallback(() => {
    if (readonly) return;
    setIsHovering(false);
    setHoverValue(0);
  }, [readonly]);

  const handleClick = useCallback((starValue) => {
    if (readonly || !onChange) return;
    // Si se hace clic en el mismo valor, resetear a 0 (toggle)
    const newValue = starValue === value ? 0 : starValue;
    onChange(newValue);
  }, [readonly, onChange, value]);

  const handleHalfClick = useCallback((e, starIndex) => {
    if (readonly || !onChange || !allowHalf) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;
    
    const newValue = isLeftHalf ? starIndex - 0.5 : starIndex;
    onChange(newValue === value ? 0 : newValue);
  }, [readonly, onChange, allowHalf, value]);

  const sizeClass = SIZES[size] || SIZES.md;
  const gapClass = GAPS[gap] || GAPS.sm;

  return (
    <div className={`inline-flex items-center ${gapClass} ${className}`}>
      {label && (
        <span className="text-sm font-medium text-gray-700 mr-2">{label}</span>
      )}
      
      <div 
        className={`inline-flex items-center ${gapClass}`}
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1;
          const isFilled = displayValue >= starValue;
          const isHalf = allowHalf && displayValue >= starValue - 0.5 && displayValue < starValue;
          
          return (
            <button
              key={i}
              type="button"
              disabled={readonly}
              onClick={allowHalf ? (e) => handleHalfClick(e, starValue) : () => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              className={`
                relative focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 rounded
                ${readonly ? 'cursor-default' : 'cursor-pointer'}
                ${animated && !readonly ? 'transition-transform duration-150 hover:scale-110 active:scale-95' : ''}
                ${isFilled || isHalf ? activeColor : inactiveColor}
                ${isHovering && starValue <= hoverValue && !readonly ? hoverColor : ''}
              `}
              aria-label={`${starValue} de ${max} estrellas`}
            >
              <StarIcon 
                filled={isFilled} 
                half={isHalf}
                className={sizeClass}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="ml-2 text-sm font-semibold text-gray-700">
          {value.toFixed(1)}
        </span>
      )}

      {showCount && count > 0 && (
        <span className="ml-1 text-sm text-gray-500">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}

StarRating.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
  max: PropTypes.number,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  gap: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  readonly: PropTypes.bool,
  showValue: PropTypes.bool,
  showCount: PropTypes.bool,
  count: PropTypes.number,
  allowHalf: PropTypes.bool,
  label: PropTypes.string,
  className: PropTypes.string,
  activeColor: PropTypes.string,
  inactiveColor: PropTypes.string,
  hoverColor: PropTypes.string,
  animated: PropTypes.bool
};

export default memo(StarRating);

// Export individual star for custom use
export { StarIcon };
