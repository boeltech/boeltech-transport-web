import { useMemo } from "react";
import { PieChart } from "lucide-react";
import {
  BoeltechDonutChart,
  ChartCard,
} from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import type { useDashboard } from "../../application/hooks/useDashboard";
import {
  DASHBOARD_DRIVER_STATUS_SERIES,
  DASHBOARD_FLEET_STATUS_SERIES,
} from "../config/dashboardChartConfig";
import { dashboardCopy } from "../copy/dashboardCopy";
import {
  filterNonZeroChartSlices,
  financeCountValueFormatter,
} from "../utils/dashboardChartHelpers";

function ChartEmptyState({ description }: { description: string }) {
  return (
    <EmptyState
      size="sm"
      icon={<PieChart className="h-8 w-8 text-muted-foreground" />}
      title={dashboardCopy.charts.empty.title}
      description={description}
    />
  );
}

interface DashboardFleetDriversChartsProps {
  data: ReturnType<typeof useDashboard>["data"];
  isLoading: boolean;
}

export function DashboardFleetDriversCharts({
  data,
  isLoading,
}: DashboardFleetDriversChartsProps) {
  const vehicles = data?.stats.vehicles;
  const drivers = data?.stats.drivers;

  const fleetSlices = useMemo(() => {
    if (!vehicles) {
      return { data: [], series: DASHBOARD_FLEET_STATUS_SERIES };
    }

    const dataRows = [
      { label: dashboardCopy.charts.fleet.series.onTrip, value: vehicles.on_trip },
      {
        label: dashboardCopy.charts.fleet.series.available,
        value: vehicles.available,
      },
      {
        label: dashboardCopy.charts.fleet.series.maintenance,
        value: vehicles.in_maintenance,
      },
    ];

    return filterNonZeroChartSlices(dataRows, DASHBOARD_FLEET_STATUS_SERIES);
  }, [vehicles]);

  const driverSlices = useMemo(() => {
    if (!drivers) {
      return { data: [], series: DASHBOARD_DRIVER_STATUS_SERIES };
    }

    const absent = drivers.on_vacation + drivers.on_leave;
    const dataRows = [
      {
        label: dashboardCopy.charts.drivers.series.available,
        value: drivers.available,
      },
      { label: dashboardCopy.charts.drivers.series.onTrip, value: drivers.on_trip },
      { label: dashboardCopy.charts.drivers.series.absent, value: absent },
    ];

    return filterNonZeroChartSlices(dataRows, DASHBOARD_DRIVER_STATUS_SERIES);
  }, [drivers]);

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartCard
        title={dashboardCopy.charts.fleet.title}
        description={dashboardCopy.charts.fleet.description}
        isLoading={isLoading}
        className="flex-1"
        aria-label={dashboardCopy.charts.fleet.ariaLabel}
        footer={
          vehicles ? (
            <p className="text-xs text-muted-foreground">
              {dashboardCopy.charts.fleet.footer(
                vehicles.on_trip,
                vehicles.available,
                vehicles.in_maintenance,
              )}
            </p>
          ) : undefined
        }
      >
        {!isLoading && fleetSlices.data.length === 0 ? (
          <ChartEmptyState
            description={dashboardCopy.charts.fleet.emptyDescription}
          />
        ) : (
          <BoeltechDonutChart
            data={fleetSlices.data}
            series={fleetSlices.series}
            height={180}
            valueFormatter={financeCountValueFormatter}
            centerLabel={
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {vehicles?.total ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dashboardCopy.charts.fleet.centerLabel}
                </p>
              </div>
            }
          />
        )}
      </ChartCard>

      <ChartCard
        title={dashboardCopy.charts.drivers.title}
        description={dashboardCopy.charts.drivers.description}
        isLoading={isLoading}
        className="flex-1"
        aria-label={dashboardCopy.charts.drivers.ariaLabel}
        footer={
          drivers ? (
            <p className="text-xs text-muted-foreground">
              {dashboardCopy.charts.drivers.footer(
                drivers.available,
                drivers.on_trip,
                drivers.on_vacation + drivers.on_leave,
              )}
            </p>
          ) : undefined
        }
      >
        {!isLoading && driverSlices.data.length === 0 ? (
          <ChartEmptyState
            description={dashboardCopy.charts.drivers.emptyDescription}
          />
        ) : (
          <BoeltechDonutChart
            data={driverSlices.data}
            series={driverSlices.series}
            height={180}
            valueFormatter={financeCountValueFormatter}
            centerLabel={
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {drivers?.total ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dashboardCopy.charts.drivers.centerLabel}
                </p>
              </div>
            }
          />
        )}
      </ChartCard>
    </div>
  );
}
