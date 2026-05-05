/**
 * DetailSection
 * Shared UI - Data Display
 *
 * Wrapper para sub-secciones dentro de tabs en una detail page.
 * Encapsula el patrón "encabezado con icon + título + descripción +
 * contenido (cards, grid, lista)".
 *
 * Útil cuando un tab necesita varias agrupaciones lógicas internas
 * (ej. tab "Información" en Driver con sub-secciones de "Datos personales"
 * y "Datos del empleado", o el tab "Documentos" de Vehicle con
 * "Documentación vigente" + "Documentos cargados").
 *
 * @example
 * <DetailSection
 *   icon={<Shield className="h-4 w-4" />}
 *   title="Documentación vigente"
 *   description="Pólizas y permisos requeridos"
 * >
 *   <Card>...</Card>
 * </DetailSection>
 */

import type { ReactNode } from "react";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export interface DetailSectionProps {
  /** Icono lateral del header. */
  icon?: ReactNode;
  /** Título de la sección (h3). */
  title: ReactNode;
  /** Descripción complementaria opcional. */
  description?: ReactNode;
  /** Slot de acciones (botón "Agregar", "Editar", etc.) alineado a la derecha. */
  actions?: ReactNode;
  /** Contenido principal. */
  children: ReactNode;
  /** Clases extra para el contenedor. */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DetailSection({
  icon,
  title,
  description,
  actions,
  children,
  className,
}: DetailSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-base font-semibold flex items-center gap-2">
            {icon ? (
              <span className="text-muted-foreground shrink-0">{icon}</span>
            ) : null}
            {title}
          </h3>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

export default DetailSection;
