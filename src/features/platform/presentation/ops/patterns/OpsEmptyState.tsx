import type { ReactNode } from "react";
import { cn } from "@shared/lib/utils/cn";
import { OpsPanel, OpsPanelBody } from "../ui/OpsPanel";

export type OpsEmptyStateVariant = "empty" | "error" | "loading";

export interface OpsEmptyStateProps {
  variant?: OpsEmptyStateVariant;
  title: string;
  description?: string;
  /** CTA (Reintentar, etc.) — típico en `error`. */
  action?: ReactNode;
  className?: string;
  /**
   * Envolver en OpsPanel. Default false: el vacío no anida un panel.
   */
  panel?: boolean;
}

/**
 * Vacío alineado a la izquierda. El error lleva tick danger, no un panel rojo.
 */
export function OpsEmptyState({
  variant = "empty",
  title,
  description,
  action,
  className,
  panel = false,
}: OpsEmptyStateProps) {
  const role =
    variant === "error" ? "alert" : variant === "loading" ? "status" : undefined;

  const body = (
    <div
      className={cn(
        "ops-empty",
        variant === "loading" && "ops-empty-loading",
        !panel && className,
      )}
      data-testid="ops-empty-state"
      data-ops-empty={variant}
      data-ops-tick={variant === "error" ? "danger" : undefined}
      role={role}
      aria-live={variant === "loading" ? "polite" : undefined}
      aria-busy={variant === "loading" ? true : undefined}
    >
      <p className="ops-empty-title">{title}</p>
      {description ? (
        <p className="ops-empty-description">{description}</p>
      ) : null}
      {action ? <div className="ops-empty-action">{action}</div> : null}
    </div>
  );

  if (!panel) {
    return body;
  }

  return (
    <OpsPanel className={className} data-testid="ops-empty-panel">
      <OpsPanelBody className="!p-0">{body}</OpsPanelBody>
    </OpsPanel>
  );
}
