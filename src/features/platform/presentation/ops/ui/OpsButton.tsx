import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@shared/lib/utils/cn";
import { OpsSpinner } from "./OpsSpinner";

/**
 * Craft A · solid (= primary legacy) / outline / ghost / danger.
 * `primary` se conserva como alias de `solid` para call sites existentes.
 */
export type OpsButtonVariant =
  | "solid"
  | "primary"
  | "outline"
  | "ghost"
  | "danger";

export interface OpsButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: OpsButtonVariant;
  size?: "default" | "sm";
  asChild?: boolean;
  /** Muestra spinner inline y bloquea interacción. */
  loading?: boolean;
}

const variantClass: Record<OpsButtonVariant, string> = {
  solid: "ops-btn-solid",
  primary: "ops-btn-solid",
  outline: "ops-btn-outline",
  ghost: "ops-btn-ghost",
  danger: "ops-btn-danger",
};

export const OpsButton = React.forwardRef<HTMLButtonElement, OpsButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      asChild = false,
      type = "button",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const showLoading = loading && !asChild;
    const isDisabled = Boolean(disabled || showLoading);
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        type={asChild ? undefined : type}
        disabled={asChild ? undefined : isDisabled}
        aria-busy={showLoading || undefined}
        aria-disabled={asChild && isDisabled ? true : undefined}
        className={cn(
          "ops-btn ops-ring-accent",
          variantClass[variant],
          size === "sm" && "ops-btn-sm",
          showLoading && "ops-btn-loading",
          className,
        )}
        data-ops-button={variant === "primary" ? "primary" : variant}
        data-loading={showLoading ? "true" : undefined}
        {...props}
      >
        {showLoading ? (
          <>
            <OpsSpinner size="sm" label="Cargando" />
            <span className="ops-btn-loading-label">{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
OpsButton.displayName = "OpsButton";
