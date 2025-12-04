import PropTypes from 'prop-types';

/**
 * Componente para mostrar el progreso de subida de archivos
 */
export default function UploadProgress({ 
  show = false, 
  progress = 0, 
  fileName = '', 
  message = 'Subiendo archivo...',
  totalFiles = 0,
  currentFile = 0,
  status = 'uploading' // 'uploading', 'compressing', 'processing', 'success', 'error'
}) {
  if (!show) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'compressing':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="animate-spin w-6 h-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'success':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="animate-spin w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'compressing':
        return 'bg-blue-50 border-blue-200';
      case 'processing':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      case 'compressing':
        return 'bg-blue-600';
      case 'processing':
        return 'bg-purple-600';
      default:
        return 'bg-brand-600';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-md w-full animate-slide-up" style={{ zIndex: 9999 }}>
      <div className={`rounded-lg border-2 shadow-xl p-4 ${getStatusColor()}`}>
        <div className="flex items-start gap-3">
          {/* Icono */}
          <div className="shrink-0 mt-0.5">
            {getStatusIcon()}
          </div>
          
          {/* Contenido */}
          <div className="flex-1 min-w-0">
            {/* Título */}
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-900">
                {message} {status !== 'success' && status !== 'error' && `${Math.round(progress)}%`}
              </p>
              {totalFiles > 1 && (
                <span className="text-xs text-gray-600 ml-2">
                  {currentFile}/{totalFiles}
                </span>
              )}
            </div>
            
            {/* Nombre de archivo */}
            {fileName && (
              <p className="text-xs text-gray-600 truncate mb-2" title={fileName}>
                {fileName}
              </p>
            )}
            
            {/* Barra de progreso */}
            {status !== 'success' && status !== 'error' && (
              <div className="space-y-1">
                <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{Math.round(progress)}%</span>
                  {progress < 100 && (
                    <span className="animate-pulse">
                      {status === 'compressing' ? 'Comprimiendo...' : status === 'processing' ? 'Procesando...' : 'Subiendo...'}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Mensaje de éxito o error */}
            {status === 'success' && (
              <p className="text-xs text-green-700 font-medium">
                ✓ Subida completada exitosamente
              </p>
            )}
            {status === 'error' && (
              <p className="text-xs text-red-700 font-medium">
                ✗ Error en la subida
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

UploadProgress.propTypes = {
  show: PropTypes.bool,
  progress: PropTypes.number,
  fileName: PropTypes.string,
  message: PropTypes.string,
  totalFiles: PropTypes.number,
  currentFile: PropTypes.number,
  status: PropTypes.oneOf(['uploading', 'compressing', 'processing', 'success', 'error'])
};
