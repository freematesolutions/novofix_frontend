import React from 'react';

/**
 * ErrorBoundary: Previene pantallas en blanco ante errores en tiempo de ejecución.
 * - Muestra un fallback amigable con opciones para recargar o ir al inicio.
 * - Registra el error en consola para facilitar el debugging.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Puedes enviar este log a un servicio externo si lo deseas
    console.error('ErrorBoundary captured error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-10 border rounded-md p-6 bg-red-50 text-red-900">
          <h2 className="text-xl font-semibold mb-2">Ocurrió un error en la aplicación</h2>
          <p className="text-sm mb-4">Hemos registrado el problema. Puedes intentar recargar la página o volver al inicio.</p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-xs whitespace-pre-wrap bg-red-100 p-2 rounded border border-red-200 overflow-auto mb-4">
              {String(this.state.error?.message || this.state.error)}
            </pre>
          )}
          <div className="flex items-center gap-2">
            <button onClick={this.handleReload} className="px-3 py-2 text-sm rounded bg-red-600 text-white">Recargar</button>
            <button onClick={this.handleGoHome} className="px-3 py-2 text-sm rounded border border-red-300">Ir al inicio</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
