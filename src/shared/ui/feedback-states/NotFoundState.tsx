/**
 * NotFoundState
 * Shared UI - Feedback States
 *
 * Estado para "Recurso no encontrado" + botón de regreso.
 * Reemplaza la duplicación del bloque presente en todas las detail/edit pages.
 */

import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export interface NotFoundStateProps {
  /** Icono central (típicamente la entidad: Truck, User, etc.). */
  icon: ReactNode;
  /** Título principal (ej. "Vehículo no encontrado"). */
  title: string;
  /** Descripción complementaria. */
  description?: string;
  /** Ruta a la que regresa el botón. Si se omite, no se renderiza. */
  backHref?: string;
  /** Texto del botón de regreso. Por defecto "Volver". */
  backLabel?: string;
  /** Override del onClick (precede a backHref). */
  onBackClick?: () => void;
  /** Clases extra. */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function NotFoundState({
  icon,
  title,
  description,
  backHref,
  backLabel = "Volver",
  onBackClick,
  className,
}: NotFoundStateProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBackClick) onBackClick();
    else if (backHref) navigate(backHref);
  };

  const showBackButton = !!onBackClick || !!backHref;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12",
        className,
      )}
    >
      <div className="text-muted-foreground/50 mb-4 [&_svg]:h-16 [&_svg]:w-16">
        {icon}
      </div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {description ? (
        <p className="text-muted-foreground text-center mb-4 max-w-md">
          {description}
        </p>
      ) : null}
      {showBackButton ? (
        <Button onClick={handleBack} leftIcon={<ArrowLeft />}>
          {backLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default NotFoundState;
