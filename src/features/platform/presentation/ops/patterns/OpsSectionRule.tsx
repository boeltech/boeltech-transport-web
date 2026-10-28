import type { ReactNode } from "react";
import { cn } from "@shared/lib/utils/cn";

export interface OpsSectionRuleProps {
  /** Rótulo mono en sentence case (M1). */
  label: string;
  /** Meta a la derecha (timestamp, conteo, …). */
  meta?: ReactNode;
  className?: string;
}

/**
 * M1 — regla de sección: rótulo mono + línea fina + meta.
 */
export function OpsSectionRule({
  label,
  meta,
  className,
}: OpsSectionRuleProps) {
  return (
    <div
      className={cn("ops-section-rule", className)}
      data-testid="ops-section-rule"
    >
      <span className="ops-section-rule-label">{label}</span>
      <span className="ops-section-rule-line" aria-hidden />
      {meta != null && meta !== "" ? (
        <span className="ops-section-rule-meta">{meta}</span>
      ) : null}
    </div>
  );
}
