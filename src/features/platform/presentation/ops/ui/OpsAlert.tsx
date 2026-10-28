import * as React from "react";
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

export type OpsAlertTone = "default" | "notice" | "danger" | "warn";

export interface OpsAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: OpsAlertTone;
  title?: string;
  /** Si se pasa, muestra botón dismiss (oficio banner info GH). */
  onDismiss?: () => void;
  dismissLabel?: string;
}

const toneIcon: Record<
  OpsAlertTone,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  default: Info,
  notice: Info,
  warn: AlertTriangle,
  danger: AlertCircle,
};

export function OpsAlert({
  tone = "default",
  title,
  onDismiss,
  dismissLabel = "Descartar",
  className,
  children,
  ...props
}: OpsAlertProps) {
  const assertive = tone === "warn" || tone === "danger";
  const Icon = toneIcon[tone];
  return (
    <div
      role={assertive ? "alert" : "status"}
      data-tone={tone}
      data-testid="ops-alert"
      className={cn("ops-alert", className)}
      {...props}
    >
      <span className="ops-alert-icon" aria-hidden>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="ops-alert-body">
        {title ? <p className="ops-alert-title">{title}</p> : null}
        {children}
      </div>
      {onDismiss ? (
        <button
          type="button"
          className="ops-alert-dismiss ops-ring-accent"
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
