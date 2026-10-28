import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@shared/lib/utils/cn";

/** Etapa operativa. Trial es tinta: lime no entra. */
export type OpsLifecycleSealTone = "ok" | "warn" | "danger" | "trial" | "muted";

export interface OpsLifecycleSealProps extends HTMLAttributes<HTMLSpanElement> {
  tone: OpsLifecycleSealTone;
  children: ReactNode;
}

/**
 * Sello de etapa: barra de 3px y la palabra. No es un badge genérico.
 */
export function OpsLifecycleSeal({
  tone,
  className,
  children,
  ...props
}: OpsLifecycleSealProps) {
  return (
    <span
      className={cn("ops-lifecycle-seal", className)}
      data-ops-lifecycle-seal={tone}
      data-tone={tone}
      {...props}
    >
      {children}
    </span>
  );
}
