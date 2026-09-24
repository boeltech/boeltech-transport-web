import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileWarning,
  IdCard,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import type { useNavigate } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import type {
  AlertSeverity,
  AlertType,
  DashboardAlert,
} from "../../domain/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { alertVariants } from "@shared/ui/alert";
import { ScrollArea } from "@shared/ui/scroll-area";
import { Skeleton } from "@shared/ui/skeleton";
import { dashboardCopy } from "../copy/dashboardCopy";
import {
  DASHBOARD_ALERT_SEVERITY_ORDER,
  dashboardAlertSeverityConfig,
} from "../config/dashboardAlertSeverity";
import { handleAlertClick } from "../utils/alertNavigation";

/** Max alerts shown before "Ver las N restantes" expand CTA (P1b). */
export const DASHBOARD_ALERTS_VISIBLE_LIMIT = 8;

const ALERT_ICON_MAP: Record<AlertType, React.ElementType> = {
  overdue_trip: Clock,
  license_expiring: IdCard,
  medical_certificate_expiring: Stethoscope,
  insurance_expiring: ShieldAlert,
  sct_permit_expiring: FileWarning,
};

/**
 * Dense padding only — keep a single direct SVG child so alertVariants
 * `[&:has(>svg)]:grid` / `grid-cols-[auto_1fr]` places icon | text without
 * dead air (two SVGs used to fight for col-start-1).
 */
const ALERT_ITEM_LAYOUT_OVERRIDES = "p-2.5 text-left";

function AlertItem({
  alert,
  onClick,
}: {
  alert: DashboardAlert;
  onClick?: () => void;
}) {
  const Icon = ALERT_ICON_MAP[alert.type] ?? AlertCircle;
  const severity = dashboardAlertSeverityConfig[alert.severity];

  return (
    <button
      type="button"
      className={cn(
        alertVariants({ variant: severity.alertVariant }),
        ALERT_ITEM_LAYOUT_OVERRIDES,
        "transition-opacity",
        onClick && "cursor-pointer hover:opacity-80",
      )}
      onClick={onClick}
    >
      <Icon
        className={cn("mt-0.5 h-4 w-4 shrink-0 self-start", severity.iconClassName)}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug">{alert.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {alert.description}
        </p>
      </div>
    </button>
  );
}

function SeverityCountBadge({
  severity,
  count,
}: {
  severity: AlertSeverity;
  count: number;
}) {
  const config = dashboardAlertSeverityConfig[severity];
  const label =
    severity === "error"
      ? dashboardCopy.alerts.severity.error(count)
      : severity === "warning"
        ? dashboardCopy.alerts.severity.warning(count)
        : dashboardCopy.alerts.severity.info(count);

  return (
    <Badge variant={config.badge.variant} tone={config.badge.tone}>
      {label}
    </Badge>
  );
}

interface DashboardAlertsPanelProps {
  alerts: DashboardAlert[] | undefined;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  navigate: ReturnType<typeof useNavigate>;
}

export function DashboardAlertsPanel({
  alerts,
  isLoading,
  isError = false,
  onRetry,
  navigate,
}: DashboardAlertsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const showUnavailable = isError && alerts == null && !isLoading;

  const errorCount = alerts?.filter((a) => a.severity === "error").length ?? 0;
  const warningCount =
    alerts?.filter((a) => a.severity === "warning").length ?? 0;
  const infoCount = alerts?.filter((a) => a.severity === "info").length ?? 0;

  const sorted = alerts
    ? [...alerts].sort(
        (a, b) =>
          DASHBOARD_ALERT_SEVERITY_ORDER.indexOf(a.severity) -
          DASHBOARD_ALERT_SEVERITY_ORDER.indexOf(b.severity),
      )
    : [];

  const remaining = Math.max(0, sorted.length - DASHBOARD_ALERTS_VISIBLE_LIMIT);
  const visibleAlerts =
    expanded || remaining === 0
      ? sorted
      : sorted.slice(0, DASHBOARD_ALERTS_VISIBLE_LIMIT);

  const description = (() => {
    if (isLoading) return dashboardCopy.alerts.loading;
    if (showUnavailable) return dashboardCopy.alerts.unavailableTitle;
    if (sorted.length === 0) return dashboardCopy.alerts.emptyTitle;
    return dashboardCopy.alerts.count(sorted.length);
  })();

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-warning" />
          {dashboardCopy.alerts.title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        {!isLoading && !showUnavailable && sorted.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {errorCount > 0 ? (
              <SeverityCountBadge severity="error" count={errorCount} />
            ) : null}
            {warningCount > 0 ? (
              <SeverityCountBadge severity="warning" count={warningCount} />
            ) : null}
            {infoCount > 0 ? (
              <SeverityCountBadge severity="info" count={infoCount} />
            ) : null}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : showUnavailable ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">
              {dashboardCopy.alerts.unavailableDescription}
            </p>
            {onRetry ? (
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                {dashboardCopy.alerts.retry}
              </Button>
            ) : null}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <CheckCircle className="h-10 w-10 text-success" />
            <p className="text-sm font-medium">
              {dashboardCopy.alerts.allClearTitle}
            </p>
            <p className="text-xs">{dashboardCopy.alerts.emptyDescription}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <div className="space-y-2 pr-0.5">
              {visibleAlerts.map((alert, i) => (
                <AlertItem
                  key={`${alert.type}-${alert.entity_id}-${i}`}
                  alert={alert}
                  onClick={() => handleAlertClick(alert, navigate)}
                />
              ))}
              {!expanded && remaining > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setExpanded(true)}
                >
                  {dashboardCopy.alerts.showRemaining(remaining)}
                </Button>
              ) : null}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
