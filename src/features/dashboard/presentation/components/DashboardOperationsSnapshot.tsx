import { useMemo } from "react";
import type { useDashboard } from "../../application/hooks/useDashboard";
import { dashboardCopy } from "../copy/dashboardCopy";
import { formatDashboardTodayLabel } from "../utils/dashboardChartHelpers";
import { DashboardKpiStrip } from "./DashboardKpiStrip";

interface DashboardOperationsSnapshotProps {
  data: ReturnType<typeof useDashboard>["data"];
  isLoading: boolean;
}

export function DashboardOperationsSnapshot({
  data,
  isLoading,
}: DashboardOperationsSnapshotProps) {
  const stats = data?.stats;
  const alertCount = data?.alerts?.length ?? 0;
  const periodCaption = dashboardCopy.operationsSnapshot.description;
  const today = formatDashboardTodayLabel();

  const cells = useMemo(
    () => [
      {
        label: dashboardCopy.operationsSnapshot.metrics.inProgress,
        value: stats?.trips.in_progress,
        caption: today,
        isLoading,
      },
      {
        label: dashboardCopy.operationsSnapshot.metrics.completedThisMonth,
        value: stats?.trips.completed_this_month,
        caption: periodCaption,
        tone: "success" as const,
        isLoading,
      },
      {
        label: dashboardCopy.operationsSnapshot.metrics.activeAlerts,
        value: alertCount,
        caption: periodCaption,
        tone: (alertCount > 0 ? "warning" : "default") as
          | "warning"
          | "default",
        isLoading,
      },
      {
        label: dashboardCopy.operationsSnapshot.metrics.fleetOnTrip,
        value: stats
          ? dashboardCopy.operationsSnapshot.metrics.fleetOnTripValue(
              stats.vehicles.on_trip,
              stats.vehicles.total,
            )
          : undefined,
        caption: periodCaption,
        isLoading,
      },
    ],
    [stats, alertCount, isLoading, periodCaption, today],
  );

  return (
    <div className="space-y-3">
      <div className="px-0.5">
        <h2 className="text-base font-medium tracking-tight">
          {dashboardCopy.operationsSnapshot.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {dashboardCopy.operationsSnapshot.description}
        </p>
      </div>
      <DashboardKpiStrip
        cells={cells}
        aria-label={dashboardCopy.operationsSnapshot.title}
      />
    </div>
  );
}
