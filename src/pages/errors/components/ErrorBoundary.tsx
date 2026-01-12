import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@shared/ui/button";

/**
 * Props del ErrorBoundary
 */
interface ErrorBoundaryProps {
  children: ReactNode;

  /** Componente personalizado para mostrar en caso de error */
  fallback?: ReactNode;

  /** Callback cuando ocurre un error */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * State del ErrorBoundary
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary
 *
 * Componente que captura errores de JavaScript en cualquier componente
 * hijo y muestra una UI de fallback en lugar de que la app crashee.
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * @example
 * // Con fallback personalizado
 * <ErrorBoundary fallback={<CustomErrorPage />}>
 *   <Dashboard />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Actualiza el estado cuando se captura un error
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Captura información adicional del error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Callback opcional
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log del error (en producción enviar a servicio de monitoreo)
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo.componentStack);

    // TODO: Enviar a servicio de logging (Sentry, DataDog, etc.)
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    // }
  }

  /**
   * Resetea el estado de error
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Recarga la página
   */
  handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Navega al dashboard
   */
  handleGoHome = (): void => {
    window.location.href = "/dashboard";
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Si hay un fallback personalizado, usarlo
      if (fallback) {
        return fallback;
      }

      // UI de error por defecto
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
          {/* Icono */}
          <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>

          {/* Texto */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              Algo salió mal
            </h1>
            <p className="max-w-md text-muted-foreground">
              Ocurrió un error inesperado en la aplicación. Puedes intentar
              recargar la página o volver al inicio.
            </p>
          </div>

          {/* Detalles del error (solo en desarrollo) */}
          {import.meta.env.DEV && error && (
            <div className="mb-8 w-full max-w-lg rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="mb-2 text-sm font-semibold text-destructive">
                Error: {error.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={this.handleReset}
              leftIcon={<RefreshCw />}
            >
              Intentar de nuevo
            </Button>
            <Button onClick={this.handleGoHome} leftIcon={<Home />}>
              Ir al Dashboard
            </Button>
          </div>

          {/* Footer */}
          <p className="mt-12 text-xs text-muted-foreground">
            Si el problema persiste, contacta al soporte técnico.
          </p>
        </div>
      );
    }

    return children;
  }
}

/**
 * HOC para envolver componentes con ErrorBoundary
 */
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> => {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return WithErrorBoundary;
};
