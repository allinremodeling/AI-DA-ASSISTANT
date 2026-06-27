import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/** Catches render errors in a single assistant message without killing the whole chat. */
export class MessageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Error de renderizado' };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('AI-DA message render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          No pudimos mostrar esta respuesta completa. Intenta enviar tu consulta de nuevo.
        </div>
      );
    }
    return this.props.children;
  }
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('AI-DA UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center gap-4">
          <p className="text-sm text-[#444] max-w-md">
            Algo falló al mostrar la respuesta. Recarga la página e intenta de nuevo con una foto más pequeña o tras unos segundos.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-[#111111] text-white text-sm font-medium"
          >
            Recargar AI-DA
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
