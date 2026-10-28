import type { HTMLAttributes } from "react";
import { cn } from "@shared/lib/utils/cn";

export interface OpsPlanSealProps extends HTMLAttributes<HTMLSpanElement> {
  /** Código de plan. Si viene con texto, se imprime tal cual. */
  code?: string | null;
  name?: string | null;
}

/**
 * Sello de plan: código mono sobre hairline. Sin color por tier.
 * Sin código, conserva el nombre. Sin ninguno, raya.
 */
export function OpsPlanSeal({
  name,
  code,
  className,
  ...props
}: OpsPlanSealProps) {
  const label = code?.trim() || name?.trim() || "—";
  const empty = label === "—";

  return (
    <span
      className={cn("ops-plan-seal", className)}
      data-ops-plan-seal=""
      data-empty={empty ? "true" : "false"}
      {...props}
    >
      {label}
    </span>
  );
}
