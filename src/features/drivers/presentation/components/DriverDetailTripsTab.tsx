import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { InfiniteData } from "@tanstack/react-query";
import { AlertTriangle, Ban, Clock, Route, Truck } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import {
  DetailSection,
  DetailTimeline,
  type DetailTimelineItem,
} from "@shared/ui/data-display";
import type { MappedPaginatedResult } from "@shared/api";
import type { DriverTripSummary } from "../../domain";
import {
  TripStatus,
  TRIP_STATUS_LABELS,
  type TripStatusType,
} from "@features/trips";
import { useDriverTripsInfinite } from "../../application";
import { driversCopy } from "../copy";
import { formatDate } from "@shared/utils/dateUtils";

const copy = driversCopy.detail;

interface DriverDetailTripsTabProps {
  driverId: string;
}

/** Rail del timeline: distingue Completado / En ruta / Cancelado / resto. */
function railPropsForTripStatus(
  status: TripStatusType,
): Pick<
  DetailTimelineItem,
  "icon" | "completed" | "dotBgClassName" | "dotIconClassName"
> {
  switch (status) {
    case TripStatus.COMPLETED:
      // `icon` no se muestra: DetailTimeline lo reemplaza por Check.
      return {
        icon: <Truck className="h-4 w-4" aria-hidden />,
        completed: true,
      };
    case TripStatus.IN_PROGRESS:
      return {
        icon: <Truck className="h-4 w-4" aria-hidden />,
        completed: false,
        dotBgClassName: "bg-primary/10",
        dotIconClassName: "text-primary",
      };
    case TripStatus.CANCELLED:
      return {
        icon: <Ban className="h-4 w-4" aria-hidden />,
        completed: false,
        dotBgClassName: "bg-destructive/10",
        dotIconClassName: "text-destructive",
      };
    case TripStatus.SCHEDULED:
    case TripStatus.DRAFT:
    default:
      return {
        icon: <Clock className="h-4 w-4" aria-hidden />,
        completed: false,
        dotBgClassName: "bg-muted",
        dotIconClassName: "text-muted-foreground",
      };
  }
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

  const infiniteData = data as
    | InfiniteData<MappedPaginatedResult<DriverTripSummary>>
    | undefined;

  const trips = useMemo(
    () => infiniteData?.pages.flatMap((page) => page.data) ?? [],
    [infiniteData?.pages],
  );
  const tripsTotal = infiniteData?.pages[0]?.pagination.total ?? trips.length;

  const tripTimelineItems = useMemo(
    () =>
      trips.map((trip: DriverTripSummary) => {
        const vehicleLabel = `${trip.vehicle.unitNumber} · ${trip.vehicle.licensePlate}`;
        const clientLabel = trip.client?.legalName?.trim() || null;
        const statusLabel =
          TRIP_STATUS_LABELS[trip.status] ?? String(trip.status);
        const rail = railPropsForTripStatus(trip.status);

        return {
          id: trip.id,
          ...rail,
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
              <div className="min-w-0">
                <p className="font-mono font-medium">{trip.tripCode}</p>
                <p className="text-sm text-muted-foreground">
                  {trip.originCity} → {trip.destinationCity}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {copy.format.tripMeta(vehicleLabel, clientLabel)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <Badge variant="outline">{statusLabel}</Badge>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(trip.scheduledDeparture.toISOString())}
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
      title={copy.format.tripsTab(tripsTotal)}
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
