/**
 * PageHeader Component
 * Shared UI Component
 *
 * Componente reutilizable para encabezados de página.
 * Incluye título, descripción, icono opcional y acciones.
 *
 * @example
 * <PageHeader
 *   title="Catálogos"
 *   description="Administra los catálogos SAT e internos del sistema"
 *   icon={<Database className="h-6 w-6" />}
 *   actions={<Button>Acción</Button>}
 * />
 */

import { type ReactNode } from "react";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export interface PageHeaderProps {
  /**
   * Título principal de la página
   */
  title: string;
  /**
   * Descripción o subtítulo (opcional)
   */
  description?: string;
  /**
   * Icono que se muestra junto al título (opcional)
   */
  icon?: ReactNode;
  /**
   * Acciones (botones, etc.) alineadas a la derecha (opcional)
   */
  actions?: ReactNode;
  /**
   * Contenido adicional debajo del header (breadcrumbs, tabs, etc.)
   */
  children?: ReactNode;
  /**
   * Clases CSS adicionales para el contenedor
   */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PageHeader({
  title,
  description,
  icon,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Title section */}
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {/* Actions section */}
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>

      {/* Additional content */}
      {children}
    </div>
  );
}

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * PageHeader compacto sin icono
 */
export interface PageHeaderSimpleProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeaderSimple({
  title,
  description,
  actions,
  className,
}: PageHeaderSimpleProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/**
 * PageHeader con breadcrumb integrado
 */
export interface PageHeaderWithBreadcrumbProps extends PageHeaderProps {
  breadcrumb?: ReactNode;
}

export function PageHeaderWithBreadcrumb({
  breadcrumb,
  ...props
}: PageHeaderWithBreadcrumbProps) {
  return (
    <div className="space-y-2">
      {breadcrumb && <div className="text-sm">{breadcrumb}</div>}
      <PageHeader {...props} />
    </div>
  );
}

export default PageHeader;
