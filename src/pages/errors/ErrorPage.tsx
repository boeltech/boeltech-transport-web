import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, RefreshCw, type LucideIcon } from "lucide-react";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

/**
 * Props del componente ErrorPage
 */
interface ErrorPageProps {
  /** Código de error (ej: 404, 403, 500) */
  code?: string | number;

  /** Título principal */
  title: string;

  /** Descripción del error */
  description: string | ReactNode;

  /** Icono a mostrar */
  icon: LucideIcon;

  /** Color del icono: 'muted' | 'destructive' | 'warning' */
  iconVariant?: "muted" | "destructive" | "warning";

  /** Mostrar botón de reintentar */
  showRetry?: boolean;

  /** Callback para reintentar */
  onRetry?: () => void;

  /** Mostrar botón de regresar */
  showBack?: boolean;

  /** Mostrar botón de ir al dashboard */
  showHome?: boolean;

  /** Contenido adicional debajo de los botones */
  footer?: ReactNode;
}

/**
 * ErrorPage
 *
 * Componente base reutilizable para páginas de error.
 * Proporciona un diseño consistente y acciones comunes.
 *
 * @example
 * <ErrorPage
 *   code={404}
 *   title="Página no encontrada"
 *   description="La página que buscas no existe."
 *   icon={FileQuestion}
 * />
 */
export const ErrorPage = ({
  code,
  title,
  description,
  icon: Icon,
  iconVariant = "muted",
  showRetry = false,
  onRetry,
  showBack = true,
  showHome = true,
  footer,
}: ErrorPageProps) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  // Clases según variante del icono
  const iconContainerClasses = {
    muted: "bg-muted",
    destructive: "bg-destructive/10",
    warning: "bg-warning/10",
  };

  const iconClasses = {
    muted: "text-muted-foreground",
    destructive: "text-destructive",
    warning: "text-warning",
  };

  const badgeClasses = {
    muted: "bg-primary text-primary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    warning: "bg-warning text-warning-foreground",
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Ilustración */}
      <div className="relative mb-8">
        <div
          className={cn(
            "flex h-32 w-32 items-center justify-center rounded-full",
            iconContainerClasses[iconVariant],
          )}
        >
          <Icon className={cn("h-16 w-16", iconClasses[iconVariant])} />
        </div>

        {/* Badge con código */}
        {code && (
          <div
            className={cn(
              "absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold",
              badgeClasses[iconVariant],
            )}
          >
            {code}
          </div>
        )}
      </div>

      {/* Texto */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">{title}</h1>
        <div className="max-w-md text-muted-foreground">
          {typeof description === "string" ? <p>{description}</p> : description}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {showBack && (
          <Button
            variant="outline"
            onClick={handleGoBack}
            leftIcon={<ArrowLeft />}
          >
            Regresar
          </Button>
        )}

        {showRetry && onRetry && (
          <Button variant="outline" onClick={onRetry} leftIcon={<RefreshCw />}>
            Reintentar
          </Button>
        )}

        {showHome && (
          <Button onClick={() => navigate("/dashboard")} leftIcon={<Home />}>
            Ir al Dashboard
          </Button>
        )}
      </div>

      {/* Footer opcional */}
      {footer && <div className="mt-12">{footer}</div>}
    </div>
  );
};
