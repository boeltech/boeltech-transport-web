import type { TripListRouteLabelTrip } from "../hooks/useTripListRouteLabel";
import { useTripListRouteLabel } from "../hooks/useTripListRouteLabel";

interface TripListRouteLabelProps {
  trip: TripListRouteLabelTrip;
  className?: string;
}

export function TripListRouteLabel({
  trip,
  className = "text-sm",
}: TripListRouteLabelProps) {
  const routeLabel = useTripListRouteLabel(trip);

  return <p className={className}>{routeLabel}</p>;
}
