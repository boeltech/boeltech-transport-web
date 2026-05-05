/**
 * FormPageShell
 * Shared UI - Page Shells
 *
 * Esqueleto estándar para páginas de edición simple (no wizard).
 * Reemplaza el patrón en DriverEditPage, EditVehiclePage,
 * EmployeeFormPage (modo edit).
 *
 * NOTA (clientes): la edición del registro padre vive como Sheet contextual
 * en ClientDetailPage; direcciones son sub-recurso con CRUD propio (master-detail).
 * Patrón documentado: `.agents/skills/detail-sheet-master-detail/SKILL.md`.
 *
 * Estructura:
 *   1. Loading skeleton (variant="form")
 *   2. Not-found state
 *   3. Header (back + icon + title + subtitle)
 *   4. Slot del formulario (children)
 */

import { memo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  LoadingPageState,
  NotFoundState,
  type NotFoundStateProps,
} from "@shared/ui/feedback-states";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export interface FormPageShellHeader {
  /** Ruta a la que regresa el botón back. */
  backHref: string;
  /** Aria-label del botón back. */
  backLabel?: string;
  /** Icono de la entidad. */
  icon: ReactNode;
  /** Variante del fondo del icono. Por defecto "primary". */
  iconVariant?: "primary" | "muted";
  /** Título principal. */
  title: string;
  /** Subtítulo opcional. */
  subtitle?: string;
}

export interface FormPageShellProps {
  // ── Estado ────────────────────────────────────────────────────────────────
  isLoading: boolean;
  notFound?: boolean;
  notFoundConfig?: Omit<NotFoundStateProps, "className">;

  // ── Header ────────────────────────────────────────────────────────────────
  header: FormPageShellHeader;

  // ── Slot del formulario ───────────────────────────────────────────────────
  children: ReactNode;

  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const iconBgVariants: Record<
  NonNullable<FormPageShellHeader["iconVariant"]>,
  string
> = {
  primary: "bg-primary/10 text-primary",
  muted: "bg-muted text-muted-foreground",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const FormPageShell = memo(function FormPageShell({
  isLoading,
  notFound,
  notFoundConfig,
  header,
  children,
  className,
}: FormPageShellProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingPageState variant="form" className={className} />;
  }

  if (notFound) {
    if (!notFoundConfig) {
      return (
        <NotFoundState
          icon={<span aria-hidden>?</span>}
          title="Recurso no encontrado"
        />
      );
    }
    return <NotFoundState {...notFoundConfig} />;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* ====================================================================
       * Header
       * ================================================================== */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(header.backHref)}
          aria-label={header.backLabel ?? "Volver"}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              iconBgVariants[header.iconVariant ?? "primary"],
            )}
          >
            {header.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{header.title}</h1>
            {header.subtitle ? (
              <p className="text-sm text-muted-foreground">{header.subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* ====================================================================
       * Form slot
       * ================================================================== */}
      {children}
    </div>
  );
});

export default FormPageShell;
