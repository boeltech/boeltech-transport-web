import * as React from "react";
import { cn } from "@shared/lib/utils/cn";

export type OpsAlertTone = "default" | "notice" | "danger" | "warn";

export interface OpsAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: OpsAlertTone;
  title?: string;
}

export function OpsAlert({
  tone = "default",
  title,
  className,
  children,
  ...props
}: OpsAlertProps) {
  const assertive = tone === "warn" || tone === "danger";
  return (
    <div
      role={assertive ? "alert" : "status"}
      data-tone={tone}
      className={cn("ops-alert", className)}
      {...props}
    >
      {title ? <p className="ops-alert-title">{title}</p> : null}
      {children}
    </div>
  );
}
