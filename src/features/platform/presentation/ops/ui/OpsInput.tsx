import * as React from "react";
import { cn } from "@shared/lib/utils/cn";

export interface OpsInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  /** Subdomain, folio, código y frase de confirmación. */
  mono?: boolean;
}

/**
 * Input dark Ops — tokens `--ops-*` bajo `.platform-ops`.
 */
export const OpsInput = React.forwardRef<HTMLInputElement, OpsInputProps>(
  ({ className, type = "text", error, mono, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      data-ops-input=""
      data-error={error ? "true" : undefined}
      className={cn(
        "ops-input ops-ring-accent",
        mono && "ops-font-mono",
        className,
      )}
      {...props}
    />
  ),
);
OpsInput.displayName = "OpsInput";
