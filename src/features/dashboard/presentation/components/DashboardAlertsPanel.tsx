import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
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
import { alertVariants } from "@shared/ui/alert";
import { Skeleton } from "@shared/ui/skeleton";
import { dashboardCopy } from "../copy/dashboardCopy";
import {
  DASHBOARD_ALERT_SEVERITY_ORDER,
  dashboardAlertSeverityConfig,
} from "../config/dashboardAlertSeverity";
import { handleAlertClick } from "../utils/alertNavigation";

const ALERT_ICON_MAP: Record<AlertType, React.ElementType> = {
  overdue_trip: Clock,
  license_expiring: IdCard,
  medical_certificate_expiring: Stethoscope,
  insurance_expiring: ShieldAlert,
  sct_permit_expiring: FileWarning,
};

const ALERT_ITEM_LAYOUT_OVERRIDES =
  "relative flex w-full items-start gap-2.5 p-2.5 text-left [&>svg]:static [&>svg]:left-auto [&>svg]:top-auto [&>svg~*]:pl-0 [&>svg+div]:translate-y-0";

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
        className={cn("mt-0.5 h-4 w-4 shrink-0", severity.iconClassName)}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{alert.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {alert.description}
        </p>
      </div>
      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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
  navigate: ReturnType<typeof useNavigate>;
}

export function DashboardAlertsPanel({
  alerts,
  isLoading,
  navigate,
}: DashboardAlertsPanelProps) {
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

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-warning" />
          {dashboardCopy.alerts.title}
        </CardTitle>
        <CardDescription>
          {isLoading
            ? dashboardCopy.alerts.loading
            : sorted.length === 0
              ? dashboardCopy.alerts.emptyTitle
              : dashboardCopy.alerts.count(sorted.length)}
        </CardDescription>
        {!isLoading && sorted.length > 0 ? (
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
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <CheckCircle className="h-10 w-10 text-success" />
            <p className="text-sm font-medium">
              {dashboardCopy.alerts.allClearTitle}
            </p>
            <p className="text-xs">{dashboardCopy.alerts.emptyDescription}</p>
          </div>
        ) : (
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-0.5">
            {sorted.map((alert, i) => (
              <AlertItem
                key={`${alert.type}-${alert.entity_id}-${i}`}
                alert={alert}
                onClick={() => handleAlertClick(alert, navigate)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
