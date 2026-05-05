/**
 * EmptyState
 * Shared UI - Feedback States
 *
 * Estado vacío genérico para listas, tabs o secciones sin datos.
 * Reemplaza la duplicación del bloque "no se encontraron…" presente en
 * todas las list pages y en varios tabs de detail pages.
 */

import type { ReactNode } from "react";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export interface EmptyStateCta {
  /** Texto del botón. */
  label: string;
  /** Icono opcional dentro del botón. */
  icon?: ReactNode;
  /** Handler de click. */
  onClick: () => void;
  /** Variante visual del botón. Por defecto "default". */
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export interface EmptyStateProps {
  /** Icono central del estado vacío. */
  icon: ReactNode;
  /** Título principal (h3). */
  title: string;
  /** Descripción complementaria. */
  description?: string;
  /** Botón de acción primario (CTA). */
  cta?: EmptyStateCta;
  /** CTA secundario (ej. "Limpiar filtros"). */
  secondaryCta?: EmptyStateCta;
  /** Padding vertical. Por defecto "lg" (py-12). */
  size?: "sm" | "md" | "lg";
  /** Clases extra. */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const sizeClasses: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  sm: "py-6",
  md: "py-8",
  lg: "py-12",
};

export function EmptyState({
  icon,
  title,
  description,
  cta,
  secondaryCta,
  size = "lg",
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("text-center", sizeClasses[size], className)}>
      <div
        className={cn(
          "mx-auto w-24 h-24 rounded-full bg-muted",
          "flex items-center justify-center mb-4",
          "[&_svg]:h-10 [&_svg]:w-10 [&_svg]:text-muted-foreground",
        )}
      >
        {icon}
      </div>
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mb-4">{description}</p>
      ) : null}
      {(cta || secondaryCta) ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {cta ? (
            <Button
              variant={cta.variant ?? "default"}
              onClick={cta.onClick}
              leftIcon={cta.icon}
            >
              {cta.label}
            </Button>
          ) : null}
          {secondaryCta ? (
            <Button
              variant={secondaryCta.variant ?? "outline"}
              onClick={secondaryCta.onClick}
              leftIcon={secondaryCta.icon}
            >
              {secondaryCta.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default EmptyState;
