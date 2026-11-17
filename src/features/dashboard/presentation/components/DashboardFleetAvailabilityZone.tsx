/**
 * Zona «Disponibles ahora» — barras apiladas libre operativo (fleet-availability).
 */

import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import { StackedAvailabilityBar } from "@shared/ui/stacked-availability";
import { useFleetAvailability } from "../../application/hooks/useFleetAvailability";
import { dashboardCopy } from "../copy/dashboardCopy";

export function DashboardFleetAvailabilityZone() {
  const { data, isLoading, isError, refetch, isFetching } =
    useFleetAvailability();
  const copy = dashboardCopy.fleetAvailability;

  return (
    <section
      className="flex h-full min-w-0 flex-col gap-2"
      aria-labelledby="fleet-availability-zone-title"
    >
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2
          id="fleet-availability-zone-title"
          className="text-base font-semibold leading-6 text-foreground"
        >
          {copy.title}
        </h2>
      </div>

      {isError ? (
        <DetailAlertCard
          severity="critical"
          icon={<AlertCircle className="h-4 w-4" />}
          title={copy.errorTitle}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch();
              }}
              disabled={isFetching}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {copy.retry}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3.5 px-5 py-4">
            {isLoading || !data ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : (
              <>
                <StackedAvailabilityBar
                  freeCount={data.vehicles.free}
                  freeCaption={copy.vehiclesFreeCaption(
                    data.vehicles.totalActive,
                  )}
                  href="/vehicles"
                  linkLabel={copy.vehiclesLink}
                  segments={[
                    {
                      id: "v-free",
                      label: copy.legend.free,
                      count: data.vehicles.free,
                      tone: "free",
                    },
                    {
                      id: "v-trip",
                      label: copy.legend.onTrip,
                      count: data.vehicles.onTrip,
                      tone: "onTrip",
                    },
                    {
                      id: "v-shop",
                      label: copy.legend.inMaintenance,
                      count: data.vehicles.inMaintenance,
                      tone: "maintenance",
                    },
                    {
                      id: "v-off",
                      label: copy.legend.outOfService,
                      count: data.vehicles.outOfService,
                      tone: "idle",
                    },
                  ]}
                />
                <StackedAvailabilityBar
                  freeCount={data.drivers.free}
                  freeCaption={copy.driversFreeCaption(
                    data.drivers.totalActive,
                  )}
                  href="/drivers"
                  linkLabel={copy.driversLink}
                  segments={[
                    {
                      id: "d-free",
                      label: copy.legend.free,
                      count: data.drivers.free,
                      tone: "free",
                    },
                    {
                      id: "d-trip",
                      label: copy.legend.onTrip,
                      count: data.drivers.onTrip,
                      tone: "onTrip",
                    },
                    {
                      id: "d-rest",
                      label: copy.legend.resting,
                      count: data.drivers.resting,
                      tone: "idle",
                    },
                  ]}
                />
              </>
            )}
            <p className="border-t border-border pt-2.5 text-xs text-muted-foreground">
              {copy.note}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
