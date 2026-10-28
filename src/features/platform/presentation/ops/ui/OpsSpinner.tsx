import * as React from "react";
import { cn } from "@shared/lib/utils/cn";

export type OpsSpinnerSize = "sm" | "md" | "lg";
export type OpsSpinnerVariant = "inline" | "block";

export interface OpsSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: OpsSpinnerSize;
  /** `inline` = in-flow (botones); `block` = centrado en contenedor. */
  variant?: OpsSpinnerVariant;
  label?: string;
}

/**
 * Spinner Ops — alineado a `--ops-skeleton` / row 37. Sin pulse ERP.
 */
export function OpsSpinner({
  size = "md",
  variant = "inline",
  label = "Cargando",
  className,
  ...props
}: OpsSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      data-ops-spinner={variant}
      data-size={size}
      className={cn(
        "ops-spinner",
        variant === "block" && "ops-spinner-block",
        className,
      )}
      {...props}
    >
      <span className="ops-spinner-ring" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}
