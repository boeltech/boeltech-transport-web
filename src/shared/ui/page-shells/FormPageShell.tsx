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
 *   3. Header (staff crumbs | portal back | legacy back+icon) + title
 *   4. Slot del formulario (children)
 *
 * NL2/NL4: staff = migas sin flecha/ícono; portal = ← Volver;
 * legacy (deprecated) = flecha + ícono hasta migrar consumers.
 */

import { memo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Breadcrumbs, type Crumb } from "@shared/ui/breadcrumbs";
import {
  LoadingPageState,
  NotFoundState,
  type NotFoundStateProps,
} from "@shared/ui/feedback-states";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

type FormHeaderBase = {
  /** Título principal. */
  title: string;
  /** Subtítulo opcional. */
  subtitle?: string;
  /** Slot a la derecha del título (badge, acciones). */
  trailing?: ReactNode;
};

export type FormPageShellHeader =
  | (FormHeaderBase & {
      variant?: "staff";
      crumbs: readonly Crumb[];
    })
  | (FormHeaderBase & {
      variant: "portal";
      backHref: string;
      backLabel?: string;
      icon?: ReactNode;
      iconVariant?: "primary" | "muted";
    })
  /** @deprecated Prefer staff `crumbs` (NL2/NL4). Kept until consumers migrate. */
  | (FormHeaderBase & {
      backHref: string;
      backLabel?: string;
      icon: ReactNode;
      iconVariant?: "primary" | "muted";
    });

export interface FormPageShellProps {
  // ── Estado ────────────────────────────────────────────────────────────────
  isLoading: boolean;
  notFound?: boolean;
  notFoundConfig?: Omit<NotFoundStateProps, "className">;

  // ── Header ────────────────────────────────────────────────────────────────
  header: FormPageShellHeader;

  // ── Slot del formulario ───────────────────────────────────────────────────
  children: ReactNode;

  /**
   * Panel lateral (evolve-ds 2026-11-16 · cobranza F1b).
   * ≥ lg: columna sticky a la derecha (~280–340 px).
   * < lg: se apila debajo de children.
   */
  aside?: ReactNode;

  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function hasCrumbs(
  header: FormPageShellHeader,
): header is FormHeaderBase & { crumbs: readonly Crumb[] } {
  return (
    "crumbs" in header &&
    Array.isArray((header as { crumbs?: unknown }).crumbs)
  );
}

function isPortalHeader(
  header: FormPageShellHeader,
): header is FormHeaderBase & {
  variant: "portal";
  backHref: string;
  backLabel?: string;
  icon?: ReactNode;
  iconVariant?: "primary" | "muted";
} {
  return "variant" in header && header.variant === "portal";
}

const iconBgVariants: Record<"primary" | "muted", string> = {
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
  aside,
  className,
}: FormPageShellProps) {
  const navigate = useNavigate();
  const staff = hasCrumbs(header);
  const portal = isPortalHeader(header);
  const legacy = !staff && !portal;
  const showBack = portal || legacy;
  const showIcon =
    !staff &&
    "icon" in header &&
    header.icon != null;
  const iconVariant =
    !staff && "iconVariant" in header
      ? (header.iconVariant ?? "primary")
      : "primary";

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

  const headerBlock = (
    <div className="flex flex-col gap-1.5">
      {staff ? <Breadcrumbs crumbs={header.crumbs} /> : null}
      <div className="flex items-start gap-4">
        {showBack ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate((header as { backHref: string }).backHref)
            }
            aria-label={
              "backLabel" in header && header.backLabel
                ? header.backLabel
                : "Volver"
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : null}
        <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {showIcon ? (
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  iconBgVariants[iconVariant],
                )}
              >
                {header.icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{header.title}</h1>
              {header.subtitle ? (
                <p className="text-sm text-muted-foreground">{header.subtitle}</p>
              ) : null}
            </div>
          </div>
          {header.trailing ? (
            <div className="shrink-0">{header.trailing}</div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!aside) {
    return (
      <div className={cn("space-y-6", className)}>
        {headerBlock}
        {children}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {headerBlock}
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(280px,340px)]">
        <div className="min-w-0">{children}</div>
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {aside}
        </aside>
      </div>
    </div>
  );
});

export default FormPageShell;
