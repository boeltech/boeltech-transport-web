import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@shared/lib/utils/cn";

export type OpsButtonVariant = "primary" | "ghost" | "danger";

export interface OpsButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: OpsButtonVariant;
  size?: "default" | "sm";
  asChild?: boolean;
}

const variantClass: Record<OpsButtonVariant, string> = {
  primary: "ops-btn-primary",
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
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        type={asChild ? undefined : type}
        className={cn(
          "ops-btn ops-ring-accent",
          variantClass[variant],
          size === "sm" && "ops-btn-sm",
          className,
        )}
        data-ops-button={variant}
        {...props}
      />
    );
  },
);
OpsButton.displayName = "OpsButton";
