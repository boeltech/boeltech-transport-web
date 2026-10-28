import type { HTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";

export interface OpsAuditLineProps extends HTMLAttributes<HTMLDivElement> {
  /** Timestamp ya formateado. */
  time: string;
  actor: string;
  verb: string;
  object: string;
  objectHref?: string;
  /** Detalle muted. No lleva color de señal. */
  detail?: string;
  /** Pinta solo el verbo. La línea no lleva icono. */
  destructive?: boolean;
}

/**
 * Línea de auditoría: hora mono, actor en tinta, verbo muted, objeto en tinta.
 */
export function OpsAuditLine({
  time,
  actor,
  verb,
  object: objectLabel,
  objectHref,
  detail,
  destructive = false,
  className,
  ...props
}: OpsAuditLineProps) {
  return (
    <div
      className={cn("ops-audit-line", className)}
      data-testid="ops-audit-line"
      {...props}
      data-ops-tick={destructive ? "danger" : undefined}
    >
      <span className="ops-audit-time">{time}</span>
      <span className="ops-audit-actor">{actor}</span>
      <span className="ops-audit-verb" data-destructive={destructive ? "true" : "false"}>
        {verb}
      </span>
      {objectHref ? (
        <Link to={objectHref} className="ops-audit-object ops-ring-accent">
          {objectLabel}
        </Link>
      ) : (
        <span className="ops-audit-object">{objectLabel}</span>
      )}
      {detail ? <span className="ops-audit-detail">{detail}</span> : null}
    </div>
  );
}
