/**
 * Banda matutina Aurora — chrome fijo (no WidgetId).
 * Saludo + resumen del día + viajes de hoy.
 */

import type { ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  Banknote,
  ClipboardCheck,
  MapPin,
  Route,
} from "lucide-react";
import type { NavigateFunction } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { getGreeting, type UserLike } from "@/shared/lib/userHelpers";
import { formatMxCurrencyOrDash } from "@shared/utils/formatMxCurrency";
import { getTodayString } from "@shared/utils/dateUtils";
import { DASHBOARD_PATH } from "@shared/utils/reportsWayfinding";
import { FINANCE_COBROS_PATH } from "@features/finance/application";
import { TripStatus, type TripStatusType } from "@features/trips";
import { TripStatusBadge } from "@features/trips/presentation";
import { APPROVALS_INBOX_PATH } from "@features/approvals/presentation";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@shared/ui/card";
import { EmptyState } from "@shared/ui/feedback-states";
import { Skeleton } from "@shared/ui/skeleton";
import type { RecentTrip } from "../../domain/types";
import {
  buildPendingApprovalsHref,
  DASHBOARD_ALERTS_WIDGET_DOM_ID,
  type PendingApprovalsBriefCounts,
} from "../../domain/morningBrief";
import { dashboardCopy } from "../copy/dashboardCopy";
import { formatDashboardTodayLabel } from "../utils/dashboardChartHelpers";

function isTripStatus(value: string): value is TripStatusType {
  return Object.values(TripStatus).includes(value as TripStatusType);
}

function focusAlertsPanel() {
  const el = document.getElementById(DASHBOARD_ALERTS_WIDGET_DOM_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.focus({ preventScroll: true });
}

interface MorningStatRowProps {
  icon: ReactNode;
  label: string;
  microLabel: string;
  value: string;
  onClick?: () => void;
  isLoading?: boolean;
}

function MorningStatRow({
  icon,
  label,
  microLabel,
  value,
  onClick,
  isLoading,
}: MorningStatRowProps) {
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-sm font-medium text-card-foreground">
            {label}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {microLabel}
          </span>
        </span>
        {isLoading ? (
          <Skeleton className="mt-0.5 h-6 w-16" />
        ) : (
          <span className="block truncate text-lg font-semibold tabular-nums tracking-tight text-card-foreground">
            {value}
          </span>
        )}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {body}
      </button>
    );
  }

  return (
    <div className="flex w-full items-center gap-3 rounded-lg px-1 py-2">
      {body}
    </div>
  );
}

function TripTodayRow({
  trip,
  onClick,
}: {
  trip: RecentTrip;
  onClick: () => void;
}) {
  const status = isTripStatus(trip.status) ? trip.status : TripStatus.DRAFT;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-2 text-left transition-colors",
        "hover:border-border hover:bg-muted/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-card-foreground">
            {trip.trip_code}
          </span>
          <TripStatusBadge status={status} size="sm" showIcon={false} />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{trip.origin_city}</span>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <span className="truncate">{trip.destination_city}</span>
        </div>
      </div>
    </button>
  );
}

export interface DashboardMorningBriefProps {
  user: UserLike | null | undefined;
  /** Total «Me toca» de la bandeja de aprobaciones; undefined = sin dato → «—». */
  pendingApprovals: number | undefined;
  /** Desglose por tipo (elige el destino del click). */
  pendingApprovalsCounts?: PendingApprovalsBriefCounts;
  /** Mostrar fila «Por autorizar» (finance_approvals.read). Sin permiso no se monta. */
  showPendingApprovalsStat?: boolean;
  isPendingApprovalsLoading?: boolean;
  collectedYesterday: number | null | undefined;
  /** Mostrar fila cobrado (finance.read). Si false, se oculta aunque el valor sea 0. */
  showCollectedStat?: boolean;
  alertCount: number;
  tripsToday: RecentTrip[] | undefined;
  isLoading: boolean;
  navigate: NavigateFunction;
  fromHref?: string;
}

export function DashboardMorningBrief({
  user,
  pendingApprovals,
  pendingApprovalsCounts,
  showPendingApprovalsStat = false,
  isPendingApprovalsLoading = false,
  collectedYesterday,
  showCollectedStat = true,
  alertCount,
  tripsToday,
  isLoading,
  navigate,
  fromHref = DASHBOARD_PATH,
}: DashboardMorningBriefProps) {
  const copy = dashboardCopy.morningBrief;
  const navState = { from: fromHref };
  const rows = tripsToday ?? [];
  const todayOpsDay = getTodayString();
  // null = sin finance.read en API → no inventar 0; false en showCollectedStat = ocultar.
  const showCollected =
    showCollectedStat && collectedYesterday !== null;

  return (
    <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-border shadow-sm">
      <CardHeader className="space-y-1 pb-3">
        <p className="text-xs capitalize text-muted-foreground">
          {formatDashboardTodayLabel()}
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-card-foreground sm:text-2xl">
          {getGreeting(user)}
        </h2>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-5 pt-0">
        <section aria-label={copy.summaryTitle} className="space-y-1">
          <h3 className="px-1 text-sm font-medium text-card-foreground">
            {copy.summaryTitle}
          </h3>
          <div className="divide-y divide-border">
            {showPendingApprovalsStat ? (
              <MorningStatRow
                icon={<ClipboardCheck className="h-4 w-4" aria-hidden />}
                label={copy.stats.pendingApprovals}
                microLabel={copy.microLabels.mine}
                value={
                  pendingApprovals == null ? "—" : String(pendingApprovals)
                }
                isLoading={isPendingApprovalsLoading}
                onClick={() =>
                  navigate(
                    buildPendingApprovalsHref(
                      APPROVALS_INBOX_PATH,
                      pendingApprovalsCounts,
                    ),
                    { state: navState },
                  )
                }
              />
            ) : null}
            {showCollected ? (
              <MorningStatRow
                icon={<Banknote className="h-4 w-4" aria-hidden />}
                label={copy.stats.collectedYesterday}
                microLabel={copy.microLabels.yesterday}
                value={formatMxCurrencyOrDash(collectedYesterday)}
                isLoading={isLoading}
                onClick={() =>
                  navigate(FINANCE_COBROS_PATH, { state: navState })
                }
              />
            ) : null}
            <MorningStatRow
              icon={<Bell className="h-4 w-4" aria-hidden />}
              label={copy.stats.activeAlerts}
              microLabel={copy.microLabels.active}
              value={String(alertCount)}
              isLoading={isLoading}
              onClick={focusAlertsPanel}
            />
          </div>
        </section>

        <section
          aria-label={copy.tripsToday.title}
          className="flex min-h-0 flex-1 flex-col gap-2"
        >
          <h3 className="px-1 text-sm font-medium text-card-foreground">
            {copy.tripsToday.title}
          </h3>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))
            ) : rows.length === 0 ? (
              <EmptyState
                size="sm"
                icon={<Route aria-hidden />}
                title={copy.tripsToday.empty}
                description={
                  <p className="text-xs">{copy.tripsToday.emptyHint}</p>
                }
                className="px-2 [&_h3]:text-sm"
              />
            ) : (
              rows.map((trip) => (
                <TripTodayRow
                  key={trip.id}
                  trip={trip}
                  onClick={() =>
                    navigate(`/trips/${trip.id}`, { state: navState })
                  }
                />
              ))
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 justify-start px-1 text-xs text-primary"
            onClick={() =>
              navigate(`/trips?opsDay=${encodeURIComponent(todayOpsDay)}`, {
                state: navState,
              })
            }
          >
            {copy.tripsToday.viewAll}
            <ArrowRight className="ml-1 h-3 w-3" aria-hidden />
          </Button>
        </section>
      </CardContent>
    </Card>
  );
}
