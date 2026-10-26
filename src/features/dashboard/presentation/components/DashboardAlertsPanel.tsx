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
import { FLEET_DOCUMENTS_PATH } from "@features/fleet-documents/domain";
import type {
  AlertSeverity,
  AlertType,
  DashboardAlert,
} from "../../domain/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { alertVariants } from "@shared/ui/alert";
import { DetailAlertCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { ScrollArea } from "@shared/ui/scroll-area";
import { Skeleton } from "@shared/ui/skeleton";
import { DASHBOARD_PATH } from "@shared/utils/reportsWayfinding";
import { dashboardCopy } from "../copy/dashboardCopy";
import {
  DASHBOARD_ALERT_SEVERITY_ORDER,
  dashboardAlertSeverityConfig,
} from "../config/dashboardAlertSeverity";
import {
  getAlertCtaLabel,
  handleAlertClick,
  hasDocumentAlerts,
} from "../utils/alertNavigation";

/** Max alerts shown before "Ver las N restantes" expand CTA (P1b). */
export const DASHBOARD_ALERTS_VISIBLE_LIMIT = 8;

/**
 * List viewport: fill the card body, then cap so a tall sibling does not
 * stretch the list without a defined height (Radix only scrolls then).
 */
export const DASHBOARD_ALERTS_LIST_VIEWPORT_CLASS =
  "h-full min-h-0 max-h-[420px]";

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
  onAction,
}: {
  alert: DashboardAlert;
  onAction: () => void;
}) {
  const Icon = ALERT_ICON_MAP[alert.type] ?? AlertCircle;
  const severity = dashboardAlertSeverityConfig[alert.severity];
  const ctaLabel = getAlertCtaLabel(alert.type);

  return (
    <div
      className={cn(
        alertVariants({ variant: severity.alertVariant }),
        ALERT_ITEM_LAYOUT_OVERRIDES,
      )}
    >
      <Icon
        className={cn("mt-0.5 h-4 w-4 shrink-0 self-start", severity.iconClassName)}
      />
      <div className="min-w-0 space-y-2">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug">{alert.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {alert.description}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={onAction}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
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
  fromHref?: string;
}

export function DashboardAlertsPanel({
  alerts,
  isLoading,
  isError = false,
  onRetry,
  navigate,
  fromHref = DASHBOARD_PATH,
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

  const showDocumentsBoardLink =
    !isLoading && !showUnavailable && hasDocumentAlerts(sorted);

  const description = (() => {
    if (isLoading) return dashboardCopy.alerts.loading;
    // Título del error vive en DetailAlertCard — no duplicar en CardDescription.
    if (showUnavailable) return dashboardCopy.alerts.unavailableDescription;
    if (sorted.length === 0) return dashboardCopy.alerts.emptyTitle;
    return dashboardCopy.alerts.count(sorted.length);
  })();

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader className="shrink-0 pb-3">
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
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : showUnavailable ? (
          <DetailAlertCard
            severity="critical"
            icon={<AlertCircle className="h-4 w-4" />}
            title={dashboardCopy.alerts.unavailableTitle}
            action={
              onRetry ? (
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                  {dashboardCopy.alerts.retry}
                </Button>
              ) : undefined
            }
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<CheckCircle aria-hidden className="text-success" />}
            title={dashboardCopy.alerts.allClearTitle}
            description={
              <p className="text-xs">{dashboardCopy.alerts.emptyDescription}</p>
            }
            className="[&_h3]:text-sm"
          />
        ) : (
          <ScrollArea
            type="scroll"
            className={DASHBOARD_ALERTS_LIST_VIEWPORT_CLASS}
          >
            <div className="space-y-2 pr-3">
              {visibleAlerts.map((alert, i) => (
                <AlertItem
                  key={`${alert.type}-${alert.entity_id}-${i}`}
                  alert={alert}
                  onAction={() => handleAlertClick(alert, navigate, fromHref)}
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
      {showDocumentsBoardLink ? (
        <CardFooter className="shrink-0 border-t pt-3">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 text-sm"
            onClick={() =>
              navigate(FLEET_DOCUMENTS_PATH, { state: { from: fromHref } })
            }
          >
            {dashboardCopy.alerts.viewAllDocuments}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
