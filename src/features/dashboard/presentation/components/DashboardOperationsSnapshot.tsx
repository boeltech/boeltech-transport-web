import { cn } from "@shared/lib/utils/cn";
import type { useDashboard } from "../../application/hooks/useDashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { dashboardCopy } from "../copy/dashboardCopy";
import { formatDashboardTodayLabel } from "../utils/dashboardChartHelpers";

function SnapshotMetric({
  label,
  value,
  tone = "default",
  isLoading,
}: {
  label: string;
  value: string | number | undefined;
  tone?: "default" | "warning" | "success" | "destructive";
  isLoading?: boolean;
}) {
  const toneClass =
    tone === "warning"
      ? "text-warning"
      : tone === "success"
        ? "text-success"
        : tone === "destructive"
          ? "text-destructive"
          : "text-foreground";

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      {isLoading ? (
        <Skeleton className="h-5 w-10" />
      ) : (
        <span className={cn("text-sm font-semibold tabular-nums", toneClass)}>
          {value ?? "—"}
        </span>
      )}
    </div>
  );
}

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

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <p className="text-xs capitalize text-muted-foreground">
          {formatDashboardTodayLabel()}
        </p>
        <CardTitle className="text-lg">
          {dashboardCopy.operationsSnapshot.title}
        </CardTitle>
        <CardDescription>
          {dashboardCopy.operationsSnapshot.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        <SnapshotMetric
          label={dashboardCopy.operationsSnapshot.metrics.inProgress}
          value={stats?.trips.in_progress}
          isLoading={isLoading}
        />
        <SnapshotMetric
          label={dashboardCopy.operationsSnapshot.metrics.completedThisMonth}
          value={stats?.trips.completed_this_month}
          tone="success"
          isLoading={isLoading}
        />
        <SnapshotMetric
          label={dashboardCopy.operationsSnapshot.metrics.cancelledThisMonth}
          value={stats?.trips.cancelled_this_month}
          tone="destructive"
          isLoading={isLoading}
        />
        <SnapshotMetric
          label={dashboardCopy.operationsSnapshot.metrics.activeAlerts}
          value={alertCount}
          tone={alertCount > 0 ? "warning" : "default"}
          isLoading={isLoading}
        />
        <SnapshotMetric
          label={dashboardCopy.operationsSnapshot.metrics.fleetOnTrip}
          value={
            stats
              ? dashboardCopy.operationsSnapshot.metrics.fleetOnTripValue(
                  stats.vehicles.on_trip,
                  stats.vehicles.total,
                )
              : undefined
          }
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}
