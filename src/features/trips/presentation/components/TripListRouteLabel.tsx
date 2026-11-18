import type { TripListItem } from "@features/trips/domain";
import type { TripListRouteLabelTrip } from "../hooks/useTripListRouteLabel";
import {
  useTripListRouteCitiesOnly,
  useTripListRouteLabel,
} from "../hooks/useTripListRouteLabel";
import { formatTripListRouteMeta } from "../helpers/tripListDisplay";

interface TripListRouteLabelProps {
  trip: TripListRouteLabelTrip &
    Partial<Pick<TripListItem, "routeType" | "cargoCount">>;
  className?: string;
  /** Si false, no muestra la línea tipo · cargas. Default true cuando hay meta. */
  showMeta?: boolean;
}

/** F11 opción B: ciudad → ciudad; tooltip = ciudad + estado. */
export function TripListRouteLabel({
  trip,
  className = "text-sm",
  showMeta = true,
}: TripListRouteLabelProps) {
  const citiesOnly = useTripListRouteCitiesOnly(trip);
  const fullLabel = useTripListRouteLabel(trip);
  const canShowMeta =
    showMeta && (trip.routeType != null || trip.cargoCount != null);

  return (
    <div className={className}>
      <p className="truncate leading-snug" title={fullLabel}>
        {citiesOnly}
      </p>
      {canShowMeta ? (
        <p className="truncate text-xs text-muted-foreground leading-snug">
          {formatTripListRouteMeta({
            routeType: trip.routeType,
            cargoCount: trip.cargoCount ?? 0,
          })}
        </p>
      ) : null}
    </div>
  );
}
