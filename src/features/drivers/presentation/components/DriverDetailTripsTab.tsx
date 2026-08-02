import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Route, Truck } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { DetailSection, DetailTimeline } from "@shared/ui/data-display";
import { TripStatus, TRIP_STATUS_LABELS } from "@features/trips";
import { useDriverTripsInfinite } from "../../application";
import { driversCopy } from "../copy";
import { formatDate } from "@shared/utils/dateUtils";

const copy = driversCopy.detail;

interface DriverDetailTripsTabProps {
  driverId: string;
}

export function DriverDetailTripsTab({ driverId }: DriverDetailTripsTabProps) {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDriverTripsInfinite(driverId, { limit: 10 });

  const trips = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data?.pages],
  );
  const tripsTotal = data?.pages[0]?.pagination.total ?? trips.length;

  const tripTimelineItems = useMemo(
    () =>
      trips.map((trip) => {
        const vehicleLabel = `${trip.vehicle.unitNumber} · ${trip.vehicle.licensePlate}`;
        const clientLabel = trip.client?.legalName?.trim() || null;

        return {
          id: trip.id,
          icon: <Truck className="h-4 w-4" />,
          completed: trip.status === TripStatus.COMPLETED,
          dotSize: "sm" as const,
          content: (
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/trips/${trip.id}`);
                }
              }}
              onClick={() => navigate(`/trips/${trip.id}`)}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono font-medium">{trip.tripCode}</p>
                  <p className="text-sm text-muted-foreground">
                    {trip.originCity} → {trip.destinationCity}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {copy.format.tripMeta(vehicleLabel, clientLabel)}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <Badge variant="outline">
                  {TRIP_STATUS_LABELS[trip.status] ?? trip.status}
                </Badge>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(
                    trip.scheduledDeparture.toISOString().split("T")[0],
                  )}
                </p>
              </div>
            </div>
          ),
        };
      }),
    [trips, navigate],
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive/70" />
          <p className="text-muted-foreground">{copy.trips.loadError}</p>
        </CardContent>
      </Card>
    );
  }

  if (trips.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Truck className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">{copy.trips.empty}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <DetailSection
      icon={<Route className="h-4 w-4" />}
      title={copy.section.trips.title}
      description={copy.section.trips.description}
    >
      <Card>
        <CardContent className="space-y-4 pt-6">
          <DetailTimeline items={tripTimelineItems} />

          {tripsTotal > trips.length || hasNextPage ? (
            <p className="text-center text-xs text-muted-foreground">
              {`Mostrando ${trips.length} de ${tripsTotal}`}
            </p>
          ) : null}

          {hasNextPage ? (
            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {isFetchingNextPage
                  ? copy.action.loadingMoreTrips
                  : copy.action.loadMoreTrips}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </DetailSection>
  );
}
