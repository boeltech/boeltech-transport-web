import * as React from "react";
import { cn } from "@shared/lib/utils/cn";

export interface OpsSwitchProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onChange" | "role" | "type"
  > {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;
}

/**
 * Switch Ops in-kit — role=switch. No importa Switch ERP.
 */
export const OpsSwitch = React.forwardRef<HTMLButtonElement, OpsSwitchProps>(
  (
    {
      className,
      checked: checkedProp,
      defaultChecked = false,
      onCheckedChange,
      disabled,
      label,
      id,
      ...props
    },
    ref,
  ) => {
    const autoId = React.useId();
    const controlId = id ?? autoId;
    const labelId = `${controlId}-label`;
    const isControlled = checkedProp !== undefined;
    const [uncontrolled, setUncontrolled] = React.useState(defaultChecked);
    const checked = isControlled ? Boolean(checkedProp) : uncontrolled;

    const toggle = () => {
      if (disabled) return;
      const next = !checked;
      if (!isControlled) setUncontrolled(next);
      onCheckedChange?.(next);
    };

    const control = (
      <button
        ref={ref}
        id={controlId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label != null ? labelId : undefined}
        disabled={disabled}
        data-ops-switch=""
        data-state={checked ? "checked" : "unchecked"}
        className={cn("ops-switch ops-ring-accent", className)}
        onClick={toggle}
        {...props}
      >
        <span className="ops-switch-thumb" aria-hidden />
      </button>
    );

    if (label == null) return control;
    return (
      <div
        className={cn("ops-check-field", disabled && "ops-check-field-disabled")}
        data-ops-check-field="switch"
      >
        {control}
        <span
          id={labelId}
          className="ops-check-label"
          onClick={disabled ? undefined : toggle}
        >
          {label}
        </span>
      </div>
    );
  },
);
OpsSwitch.displayName = "OpsSwitch";
