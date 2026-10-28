import type { HTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { OpsLifecycleSeal, type OpsLifecycleSealTone } from "../ui/OpsLifecycleSeal";
import { OpsPlanSeal } from "../ui/OpsPlanSeal";

export interface OpsTenantRowProps extends HTMLAttributes<HTMLDivElement> {
  /** Id corto, mono. */
  idLabel: string;
  name: string;
  /** Si hay href, el nombre es el enlace. La acción no va anidada ahí. */
  href?: string;
  planName?: string | null;
  lifecycleLabel: string;
  lifecycleTone: OpsLifecycleSealTone;
  /** Hora ya formateada. El patrón no llama a `Date`. */
  time: string;
  /** Un solo tick. Ok y trial no llevan barra. */
  tick?: "warn" | "danger";
  /** Slot de mutación. `platform_support` no lo pasa. */
  action?: ReactNode;
}

/**
 * Fila de empresa: id mono, nombre en tinta, sellos, un tick, hora mono.
 */
export function OpsTenantRow({
  idLabel,
  name,
  href,
  planName,
  lifecycleLabel,
  lifecycleTone,
  time,
  tick,
  action,
  className,
  ...props
}: OpsTenantRowProps) {
  const nameClass = "ops-tenant-row-name";

  return (
    <div
      className={cn("ops-tenant-row", className)}
      data-testid="ops-tenant-row"
      data-ops-tick={tick}
      {...props}
    >
      <span className="ops-tenant-row-id">{idLabel}</span>
      {href ? (
        <Link to={href} className={cn(nameClass, "ops-ring-accent")}>
          {name}
        </Link>
      ) : (
        <span className={nameClass}>{name}</span>
      )}
      <span className="ops-tenant-row-seals">
        <OpsPlanSeal name={planName} />
        <OpsLifecycleSeal tone={lifecycleTone}>{lifecycleLabel}</OpsLifecycleSeal>
      </span>
      <span className="ops-tenant-row-time">{time}</span>
      {action ? <span className="ops-tenant-row-action">{action}</span> : null}
    </div>
  );
}
