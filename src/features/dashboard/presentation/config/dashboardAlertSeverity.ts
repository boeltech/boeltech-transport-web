import type { BadgeProps } from "@shared/ui/badge";
import type { AlertSeverity } from "../../domain/types";

type AlertVariant = "destructive" | "warning" | "info";

type DashboardBadgeVariant = Extract<
  NonNullable<BadgeProps["variant"]>,
  "destructive" | "warning" | "info"
>;

export interface DashboardAlertSeverityConfig {
  alertVariant: AlertVariant;
  iconClassName: string;
  badge: {
    variant: DashboardBadgeVariant;
    tone: NonNullable<BadgeProps["tone"]>;
  };
}

export const dashboardAlertSeverityConfig: Record<
  AlertSeverity,
  DashboardAlertSeverityConfig
> = {
  error: {
    alertVariant: "destructive",
    iconClassName: "text-destructive",
    badge: { variant: "destructive", tone: "soft" },
  },
  warning: {
    alertVariant: "warning",
    iconClassName: "text-warning",
    badge: { variant: "warning", tone: "soft" },
  },
  info: {
    alertVariant: "info",
    iconClassName: "text-info",
    badge: { variant: "info", tone: "soft" },
  },
};

export const DASHBOARD_ALERT_SEVERITY_ORDER: AlertSeverity[] = [
  "error",
  "warning",
  "info",
];
