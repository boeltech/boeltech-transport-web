import * as React from "react";
import { cn } from "@shared/lib/utils/cn";

export interface OpsTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

function textLength(
  value: OpsTextareaProps["value"] | OpsTextareaProps["defaultValue"],
): number | null {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).length;
  }
  if (Array.isArray(value)) return value.join("").length;
  return null;
}

export const OpsTextarea = React.forwardRef<
  HTMLTextAreaElement,
  OpsTextareaProps
>(
  (
    { className, error, maxLength, value, defaultValue, onChange, ...props },
    ref,
  ) => {
    const controlledLength = textLength(value);
    const [uncontrolledLength, setUncontrolledLength] = React.useState(
      () => textLength(defaultValue) ?? 0,
    );
    const length = controlledLength ?? uncontrolledLength;
    const textarea = (
      <textarea
        ref={ref}
        data-ops-textarea=""
        data-error={error ? "true" : undefined}
        className={cn("ops-textarea ops-ring-accent", className)}
        {...props}
        {...(value !== undefined ? { value } : { defaultValue })}
        maxLength={maxLength}
        onChange={(event) => {
          if (controlledLength == null) {
            setUncontrolledLength(event.target.value.length);
          }
          onChange?.(event);
        }}
      />
    );

    if (maxLength == null) return textarea;

    return (
      <div className="ops-textarea-field">
        {textarea}
        <p className="ops-textarea-count">
          {length}/{maxLength}
        </p>
      </div>
    );
  },
);
OpsTextarea.displayName = "OpsTextarea";
