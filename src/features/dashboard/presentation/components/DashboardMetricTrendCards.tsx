import { useMemo, type ReactNode } from "react";
import type { useNavigate } from "react-router-dom";
import {
  BoeltechBarChart,
  Sparkline,
} from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrencyWhole } from "@shared/utils/formatMxCurrency";
import type { useDashboard } from "../../application/hooks/useDashboard";
import type { useFinanceSummary } from "@features/finance";
import type { TripsByDayData } from "../../domain/types";
import { DASHBOARD_FINANCIAL_MINI_SERIES } from "../config/dashboardChartConfig";
import { dashboardCopy } from "../copy/dashboardCopy";

interface DashboardMetricTrendCardsProps {
  data: ReturnType<typeof useDashboard>["data"];
  isLoading: boolean;
  navigate: ReturnType<typeof useNavigate>;
  tripsByDay?: TripsByDayData;
  tripsByDayLoading?: boolean;
  showFinance: boolean;
  financeLoading: boolean;
  collectedTrendData: { value: number }[];
  financeSummary?: ReturnType<typeof useFinanceSummary>["data"];
}

function MetricCell({
  title,
  subtitle,
  value,
  trend,
  isLoading,
  onClick,
  className,
}: {
  title: string;
  subtitle?: string;
  value: string;
  trend?: ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const body = (
    <div
      className={cn(
        "flex h-full items-center justify-between gap-4 p-5 sm:p-6",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
        {isLoading ? (
          <Skeleton className="mt-1 h-8 w-28" />
        ) : (
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {value}
          </p>
        )}
      </div>
      {trend && !isLoading ? (
        <div className="w-[100px] shrink-0" aria-hidden>
          {trend}
        </div>
      ) : isLoading && trend ? (
        <Skeleton className="h-8 w-[100px] shrink-0 rounded" />
      ) : null}
    </div>
  );

  if (!onClick) return body;

  return (
    <button type="button" className="w-full text-left" onClick={onClick}>
      {body}
    </button>
  );
}

export function DashboardMetricTrendCards({
  data,
  isLoading,
  navigate,
  tripsByDay,
  tripsByDayLoading,
  showFinance,
  financeLoading,
  collectedTrendData,
  financeSummary,
}: DashboardMetricTrendCardsProps) {
  const financialMonth = data?.stats.financial_month;
  const vehicles = data?.stats.vehicles;

  const activitySparkline = useMemo(() => {
    if ((tripsByDay?.points.length ?? 0) < 2) return undefined;
    return (
      <Sparkline
        data={tripsByDay!.points.map((p) => ({ value: p.completed }))}
        token="chart-1"
        height={40}
      />
    );
  }, [tripsByDay]);

  const collectedSparkline = useMemo(() => {
    if (collectedTrendData.length < 2) return undefined;
    return <Sparkline data={collectedTrendData} token="success" height={40} />;
  }, [collectedTrendData]);

  const financialMiniData = financialMonth
    ? [
        {
          label: "Mes",
          budgeted: financialMonth.budgeted_cost,
          actual: financialMonth.actual_cost,
        },
      ]
    : [];

  const fleetUtilizationSubtitle =
    vehicles != null
      ? dashboardCopy.metrics.fleetUtilization.subtitle(
          vehicles.available,
          vehicles.in_maintenance,
        )
      : undefined;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="grid md:grid-cols-2 md:divide-x">
        <MetricCell
          title={dashboardCopy.metrics.baseRate.title}
          subtitle={dashboardCopy.metrics.baseRate.subtitle}
          value={
            financialMonth
              ? formatMxCurrencyWhole(financialMonth.actual_revenue)
              : "—"
          }
          trend={activitySparkline}
          isLoading={isLoading || tripsByDayLoading}
          onClick={showFinance ? () => navigate("/finance") : undefined}
          className="border-b md:border-b-0"
        />

        {showFinance ? (
          <MetricCell
            title={dashboardCopy.metrics.collected.title}
            subtitle={dashboardCopy.metrics.collected.subtitle}
            value={
              financeSummary
                ? formatMxCurrencyWhole(financeSummary.collectedThisMonth)
                : "—"
            }
            trend={collectedSparkline}
            isLoading={isLoading || financeLoading}
            onClick={() => navigate("/finance")}
          />
        ) : (
          <MetricCell
            title={dashboardCopy.metrics.fleetUtilization.title}
            subtitle={fleetUtilizationSubtitle}
            value={
              vehicles
                ? dashboardCopy.operationsSnapshot.metrics.fleetOnTripValue(
                    vehicles.on_trip,
                    vehicles.total,
                  )
                : "—"
            }
            trend={
              financialMiniData.length > 0 ? (
                <BoeltechBarChart
                  data={financialMiniData}
                  series={DASHBOARD_FINANCIAL_MINI_SERIES}
                  height={40}
                  showLegend={false}
                />
              ) : undefined
            }
            isLoading={isLoading}
            onClick={() => navigate("/vehicles")}
          />
        )}
      </div>
    </div>
  );
}
