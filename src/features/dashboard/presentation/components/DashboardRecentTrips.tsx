import {
  ArrowRight,
  MapPin,
  Route,
  User,
} from "lucide-react";
import type { useNavigate } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import type { RecentTrip } from "../../domain/types";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { TripStatus, type TripStatusType } from "@features/trips";
import { TripStatusBadge } from "@features/trips/presentation";
import { dashboardCopy } from "../copy/dashboardCopy";

function RecentTripItem({
  trip,
  onClick,
}: {
  trip: RecentTrip;
  onClick?: () => void;
}) {
  const isEnumValue = (value: string): value is TripStatusType =>
    Object.values(TripStatus).includes(value as TripStatusType);

  const tripStatus: TripStatusType = isEnumValue(trip.status)
    ? trip.status
    : TripStatus.DRAFT;

  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-lg border p-2.5 text-left transition-colors",
        onClick && "hover:bg-muted/50",
      )}
      onClick={onClick}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{trip.trip_code}</span>
        <TripStatusBadge status={tripStatus} size="sm" showIcon={false} />
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">{trip.origin_city}</span>
        <ArrowRight className="h-3 w-3 shrink-0" />
        <span className="truncate">{trip.destination_city}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <User className="h-3 w-3" />
        <span className="truncate">{trip.driver_full_name}</span>
      </div>
    </button>
  );
}

interface DashboardRecentTripsProps {
  trips: RecentTrip[] | undefined;
  isLoading: boolean;
  navigate: ReturnType<typeof useNavigate>;
}

export function DashboardRecentTrips({
  trips,
  isLoading,
  navigate,
}: DashboardRecentTripsProps) {
  const rows = trips ?? [];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              {dashboardCopy.recentTrips.title}
            </CardTitle>
            <CardDescription>
              {isLoading
                ? dashboardCopy.recentTrips.loading
                : rows.length === 0
                  ? dashboardCopy.recentTrips.emptyTitle
                  : dashboardCopy.recentTrips.count(rows.length)}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 text-xs"
            onClick={() => navigate("/trips")}
          >
            {dashboardCopy.recentTrips.viewAll}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <Route className="h-8 w-8" />
            <p className="text-sm">{dashboardCopy.recentTrips.emptyDescription}</p>
          </div>
        ) : (
          rows.map((trip) => (
            <RecentTripItem
              key={trip.id}
              trip={trip}
              onClick={() => navigate(`/trips/${trip.id}`)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
