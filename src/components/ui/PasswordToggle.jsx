import React from 'react';

function EyeIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Outer eye shape */}
      <path d="M2 12C5.5 6.5 10 5 12 5c2 0 6.5 1.5 10 7-3.5 5.5-8 7-10 7s-6.5-1.5-10-7z" />
      {/* Pupil */}
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Outer eye shape */}
      <path d="M2 12C5.5 6.5 10 5 12 5c2 0 6.5 1.5 10 7-3.5 5.5-8 7-10 7s-6.5-1.5-10-7z" />
      {/* Pupil */}
      <circle cx="12" cy="12" r="3" />
      {/* Slash */}
      <path d="M3 3l18 18" />
    </svg>
  );
}

export default function PasswordToggle({ show, onToggle, className = '', controls, onPeekStart, onPeekEnd, title }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseDown={onPeekStart}
      onMouseUp={onPeekEnd}
      onMouseLeave={onPeekEnd}
      onTouchStart={onPeekStart}
      onTouchEnd={onPeekEnd}
      aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      aria-pressed={show}
      aria-controls={controls}
      title={title ?? (show ? 'Ocultar contraseña' : 'Mostrar contraseña')}
      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
    >
      {show ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}
