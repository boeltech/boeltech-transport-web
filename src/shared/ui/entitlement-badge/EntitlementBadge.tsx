import type { HTMLAttributes } from "react";
import { Badge } from "@shared/ui/badge";
import { cn } from "@shared/lib/utils/cn";

/**
 * EntitlementBadge — estado de contratación de un complemento (evolve-ds F5).
 *
 * Sentence-case, tono soft (o outline para la etiqueta de tipo). Solo tokens
 * semánticos. No inventar colores por feature.
 *
 * SoT: `design/tlamx/platforms/web/design.md` § Complementos.
 */

export type EntitlementBadgeVariant =
  | "active"
  | "available"
  | "unavailable"
  | "early_access"
  | "kind";

const VARIANT_CONFIG: Record<
  EntitlementBadgeVariant,
  {
    label: string;
    badgeVariant: "success" | "neutral" | "info" | "outline";
    tone?: "soft";
  }
> = {
  active: {
    label: "Activo",
    badgeVariant: "success",
    tone: "soft",
  },
  available: {
    label: "Disponible",
    badgeVariant: "neutral",
    tone: "soft",
  },
  unavailable: {
    label: "No disponible",
    badgeVariant: "neutral",
    tone: "soft",
  },
  early_access: {
    label: "Versión anticipada",
    badgeVariant: "info",
    tone: "soft",
  },
  kind: {
    label: "Complemento",
    badgeVariant: "outline",
  },
};

export interface EntitlementBadgeProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Variante de estado o etiqueta de tipo (`kind`). */
  variant: EntitlementBadgeVariant;
  /** Override del label canónico (p. ej. copy de feature). Sentence-case. */
  children?: string;
}

export function EntitlementBadge({
  variant,
  children,
  className,
  ...props
}: EntitlementBadgeProps) {
  const config = VARIANT_CONFIG[variant];
  const label = children ?? config.label;

  return (
    <Badge
      variant={config.badgeVariant}
      tone={config.tone}
      className={cn(className)}
      data-testid={`entitlement-badge-${variant}`}
      {...props}
    >
      {label}
    </Badge>
  );
}

export { VARIANT_CONFIG as ENTITLEMENT_BADGE_LABELS };
