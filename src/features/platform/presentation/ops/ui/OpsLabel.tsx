import * as React from "react";
import { cn } from "@shared/lib/utils/cn";

export interface OpsLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Asterisco en tinta. No entra al nombre accesible. */
  required?: boolean;
}

export function OpsLabel({
  className,
  children,
  required,
  ...props
}: OpsLabelProps) {
  return (
    <label className={cn("ops-label", className)} {...props}>
      {children}
      {required ? (
        <span className="ops-label-mark" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}
