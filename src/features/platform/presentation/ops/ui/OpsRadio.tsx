import * as React from "react";
import { cn } from "@shared/lib/utils/cn";

export interface OpsRadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: React.ReactNode;
}

/**
 * Radio Ops in-kit — agrupar con el mismo `name`. No importa Radio ERP.
 */
export const OpsRadio = React.forwardRef<HTMLInputElement, OpsRadioProps>(
  ({ className, label, id, disabled, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const control = (
      <input
        ref={ref}
        id={inputId}
        type="radio"
        disabled={disabled}
        data-ops-radio=""
        className={cn("ops-radio", className)}
        {...props}
      />
    );
    if (label == null) return control;
    return (
      <label
        htmlFor={inputId}
        className={cn("ops-check-field", disabled && "ops-check-field-disabled")}
        data-ops-check-field="radio"
      >
        {control}
        <span className="ops-check-label">{label}</span>
      </label>
    );
  },
);
OpsRadio.displayName = "OpsRadio";

export interface OpsRadioGroupProps
  extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend?: string;
  orientation?: "horizontal" | "vertical";
}

export function OpsRadioGroup({
  legend,
  orientation = "vertical",
  className,
  children,
  ...props
}: OpsRadioGroupProps) {
  return (
    <fieldset
      data-ops-radio-group=""
      data-orientation={orientation}
      className={cn(
        "ops-radio-group",
        orientation === "horizontal" && "ops-radio-group-row",
        className,
      )}
      {...props}
    >
      {legend ? <legend className="ops-label">{legend}</legend> : null}
      <div className="ops-radio-group-items">{children}</div>
    </fieldset>
  );
}
