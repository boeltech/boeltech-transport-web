import { useMemo } from "react";
import { Route } from "lucide-react";
import { BoeltechLineChart, ChartCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { Button } from "@shared/ui/button";
import type { TripsByDayData } from "../../domain/types";
import { DASHBOARD_TRIPS_BY_DAY_SERIES } from "../config/dashboardChartConfig";
import { dashboardCopy } from "../copy/dashboardCopy";
import {
  formatDashboardDayLabel,
  sumTripsByDayPoints,
} from "../utils/dashboardChartHelpers";
import type { TripsDayRange } from "../widgets/types";
import { TRIPS_DAY_OPTIONS } from "../widgets/types";

function TripsDaySelector({
  value,
  onChange,
}: {
  value: TripsDayRange;
  onChange: (days: TripsDayRange) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-md border bg-muted/40 p-0.5">
      {TRIPS_DAY_OPTIONS.map((days) => (
        <Button
          key={days}
          type="button"
          variant={value === days ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => onChange(days)}
        >
          {days}d
        </Button>
      ))}
    </div>
  );
}

interface DashboardTripsByDayChartProps {
  tripsByDay?: TripsByDayData;
  isLoading: boolean;
  days: TripsDayRange;
  onDaysChange: (days: TripsDayRange) => void;
}

export function DashboardTripsByDayChart({
  tripsByDay,
  isLoading,
  days,
  onDaysChange,
}: DashboardTripsByDayChartProps) {
  const chartData = useMemo(
    () =>
      tripsByDay?.points.map((point) => ({
        label: formatDashboardDayLabel(point.day),
        completed: point.completed,
        cancelled: point.cancelled,
        inProgress: point.inProgress,
      })) ?? [],
    [tripsByDay],
  );

  const totals = useMemo(
    () => sumTripsByDayPoints(tripsByDay?.points ?? []),
    [tripsByDay],
  );

  const hasActivity =
    totals.completed + totals.cancelled + totals.inProgress > 0;

  return (
    <ChartCard
      title={dashboardCopy.charts.tripsByDay.title}
      description={dashboardCopy.charts.tripsByDay.description}
      isLoading={isLoading}
      tools={<TripsDaySelector value={days} onChange={onDaysChange} />}
      aria-label={dashboardCopy.charts.tripsByDay.ariaLabel}
      footer={
        hasActivity ? (
          <p className="text-xs text-muted-foreground">
            {dashboardCopy.charts.tripsByDay.footer(
              totals.completed,
              totals.cancelled,
              totals.inProgress,
              days,
            )}
          </p>
        ) : undefined
      }
    >
      {!isLoading && !hasActivity ? (
        <EmptyState
          size="sm"
          icon={<Route className="h-8 w-8 text-muted-foreground" />}
          title={dashboardCopy.charts.empty.title}
          description={dashboardCopy.charts.tripsByDay.emptyDescription}
        />
      ) : (
        <BoeltechLineChart
          data={chartData}
          series={DASHBOARD_TRIPS_BY_DAY_SERIES}
          height={280}
        />
      )}
    </ChartCard>
  );
}
