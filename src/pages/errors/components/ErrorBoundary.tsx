import { Component, type ErrorInfo, type ReactNode } from "react";
import {
  // useNavigate,
  useRouteError,
  isRouteErrorResponse,
} from "react-router-dom";

// ============================================
// Tipos
// ============================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================
// Error Boundary (Class Component)
// ============================================

/**
 * ErrorBoundary
 *
 * Captura errores de JavaScript en componentes hijos y muestra
 * una UI de fallback en lugar de que la app crashee.
 *
 * @example
 * <ErrorBoundary>
 *   <App />
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
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log del error
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo.componentStack);

    // Callback opcional
    this.props.onError?.(error, errorInfo);

    // En producción, enviar a servicio de monitoreo
    if (import.meta.env.PROD) {
      // TODO: Sentry, DataDog, etc.
      // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Si hay fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de error por defecto
      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================
// Fallback por defecto
// ============================================

interface DefaultErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
}

const DefaultErrorFallback = ({
  error,
  onReset,
}: DefaultErrorFallbackProps) => {
  const handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Icono */}
      <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-destructive/10">
        <svg
          className="h-16 w-16 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Texto */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Algo salió mal
        </h1>
        <p className="max-w-md text-muted-foreground">
          Ocurrió un error inesperado. Puedes intentar recargar la página o
          volver al inicio.
        </p>
      </div>

      {/* Detalles del error (solo en desarrollo) */}
      {import.meta.env.DEV && error && (
        <div className="mb-8 w-full max-w-lg overflow-auto rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="mb-2 text-sm font-semibold text-destructive">
            {error.name}: {error.message}
          </p>
          {error.stack && (
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
              {error.stack}
            </pre>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Intentar de nuevo
          </button>
        )}
        <button
          onClick={handleReload}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Recargar página
        </button>
        <button
          onClick={handleGoHome}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Ir al inicio
        </button>
      </div>

      {/* Footer */}
      <p className="mt-12 text-xs text-muted-foreground">
        Si el problema persiste, contacta a{" "}
        <a
          href="mailto:soporte@boeltech.com"
          className="text-primary hover:underline"
        >
          soporte técnico
        </a>
      </p>
    </div>
  );
};

// ============================================
// Router Error Boundary (para usar con React Router)
// ============================================

/**
 * RouteErrorBoundary
 *
 * Componente para usar como errorElement en React Router.
 * Muestra diferentes páginas según el tipo de error.
 */
export const RouteErrorBoundary = () => {
  const error = useRouteError();

  // Log del error
  console.error("Route error:", error);

  // Error de respuesta HTTP (404, 403, etc.)
  if (isRouteErrorResponse(error)) {
    return (
      <HttpErrorPage status={error.status} statusText={error.statusText} />
    );
  }

  // Error de JavaScript
  if (error instanceof Error) {
    return (
      <DefaultErrorFallback
        error={error}
        onReset={() => window.location.reload()}
      />
    );
  }

  // Error desconocido
  return (
    <DefaultErrorFallback
      error={new Error("Error desconocido")}
      onReset={() => window.location.reload()}
    />
  );
};

// ============================================
// Página de error HTTP
// ============================================

interface HttpErrorPageProps {
  status: number;
  statusText?: string;
}

const HttpErrorPage = ({ status, statusText }: HttpErrorPageProps) => {
  const handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  const handleGoBack = () => {
    window.history.back();
  };

  // Configuración según status code
  const errorConfig: Record<
    number,
    { title: string; description: string; icon: string }
  > = {
    400: {
      title: "Solicitud incorrecta",
      description:
        "La solicitud no pudo ser procesada. Verifica los datos e intenta de nuevo.",
      icon: "⚠️",
    },
    401: {
      title: "No autenticado",
      description: "Necesitas iniciar sesión para acceder a esta página.",
      icon: "🔒",
    },
    403: {
      title: "Acceso denegado",
      description: "No tienes permisos para acceder a esta sección.",
      icon: "🚫",
    },
    404: {
      title: "Página no encontrada",
      description: "La página que buscas no existe o fue movida.",
      icon: "🔍",
    },
    500: {
      title: "Error del servidor",
      description: "Ocurrió un error en el servidor. Intenta más tarde.",
      icon: "💥",
    },
  };

  const config = errorConfig[status] || {
    title: `Error ${status}`,
    description: statusText || "Ocurrió un error inesperado.",
    icon: "❌",
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Icono/Código */}
      <div className="relative mb-8">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-muted text-6xl">
          {config.icon}
        </div>
        <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-sm font-bold text-destructive-foreground">
          {status}
        </div>
      </div>

      {/* Texto */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          {config.title}
        </h1>
        <p className="max-w-md text-muted-foreground">{config.description}</p>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleGoBack}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          ← Regresar
        </button>
        <button
          onClick={handleGoHome}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          Ir al inicio
        </button>
      </div>

      {/* Footer */}
      <p className="mt-12 text-xs text-muted-foreground">
        Si crees que esto es un error, contacta al administrador.
      </p>
    </div>
  );
};

// ============================================
// HOC para envolver componentes
// ============================================

/**
 * withErrorBoundary HOC
 *
 * Envuelve un componente con ErrorBoundary.
 *
 * @example
 * const SafeDashboard = withErrorBoundary(Dashboard);
 */
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
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
