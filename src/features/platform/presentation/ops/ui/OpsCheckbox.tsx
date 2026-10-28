import * as React from "react";
import { cn } from "@shared/lib/utils/cn";

export interface OpsCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: React.ReactNode;
}

/**
 * Checkbox Ops in-kit — no importa Checkbox ERP.
 */
export const OpsCheckbox = React.forwardRef<HTMLInputElement, OpsCheckboxProps>(
  ({ className, label, id, disabled, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const control = (
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        disabled={disabled}
        data-ops-checkbox=""
        className={cn("ops-checkbox", className)}
        {...props}
      />
    );
    if (label == null) return control;
    return (
      <label
        htmlFor={inputId}
        className={cn("ops-check-field", disabled && "ops-check-field-disabled")}
        data-ops-check-field="checkbox"
      >
        {control}
        <span className="ops-check-label">{label}</span>
      </label>
    );
  },
);
OpsCheckbox.displayName = "OpsCheckbox";
