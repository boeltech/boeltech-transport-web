import type { BadgeProps } from "@shared/ui/badge";
import type { ProfitabilityStatus } from "../../domain";
import { financeCopy } from "../copy";

type ProfitabilityBadgeVariant = Extract<
  NonNullable<BadgeProps["variant"]>,
  "success" | "info" | "warning" | "neutral" | "destructive"
>;

export interface ProfitabilityStatusConfigEntry {
  label: string;
  badge: {
    variant: ProfitabilityBadgeVariant;
    tone: NonNullable<BadgeProps["tone"]>;
  };
}

export const profitabilityStatusConfig: Record<
  ProfitabilityStatus,
  ProfitabilityStatusConfigEntry
> = {
  high: {
    label: financeCopy.profitability.statuses.high,
    badge: { variant: "success", tone: "soft" },
  },
  medium: {
    label: financeCopy.profitability.statuses.medium,
    badge: { variant: "info", tone: "soft" },
  },
  low: {
    label: financeCopy.profitability.statuses.low,
    badge: { variant: "warning", tone: "soft" },
  },
  breakeven: {
    label: financeCopy.profitability.statuses.breakeven,
    badge: { variant: "neutral", tone: "soft" },
  },
  loss: {
    label: financeCopy.profitability.statuses.loss,
    badge: { variant: "destructive", tone: "soft" },
  },
};

export function getProfitabilityStatusConfig(
  status: ProfitabilityStatus,
): ProfitabilityStatusConfigEntry {
  return profitabilityStatusConfig[status];
}
