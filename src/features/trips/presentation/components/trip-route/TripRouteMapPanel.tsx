import { lazy, Suspense, useMemo } from "react";
import { Navigation } from "lucide-react";

import config from "@shared/config/env";
import { Skeleton } from "@shared/ui/skeleton";
import type { TripStop } from "@features/trips/domain";

import { buildStopMarkers as buildMapStopMarkers } from "../trip-tracking/trackingMapHelpers";
import { tripDetailCopy } from "../../copy";

const TripTrackingMapView = lazy(() =>
  import("../trip-tracking/TripTrackingMapView").then((mod) => ({
    default: mod.TripTrackingMapView,
  })),
);

const copy = tripDetailCopy.route;

export type TripRouteMapPanelProps = {
  stops: readonly TripStop[];
  className?: string;
  /** Geometría de ruta planeada/real; sin ella no se muestra leyenda (F9h). */
  routeGeojson?: Record<string, unknown> | null;
};

export function TripRouteMapPanel({
  stops,
  className = "h-[400px] w-full rounded-xl",
  routeGeojson = null,
}: TripRouteMapPanelProps) {
  const mapboxToken = config.geolocation.mapboxPublicToken;
  const ordered = useMemo(
    () => [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder),
    [stops],
  );
  const hasMapData = useMemo(
    () => buildMapStopMarkers(ordered).length > 0,
    [ordered],
  );
  const showRouteLegend = routeGeojson != null;

  return (
    <div
      id="trip-route-map"
      className="overflow-hidden rounded-xl border bg-card"
    >
      {mapboxToken && hasMapData ? (
        <Suspense
          fallback={
            <Skeleton className={className} aria-label={copy.label.mapLink} />
          }
        >
          <TripTrackingMapView
            token={mapboxToken}
            stops={ordered}
            events={[]}
            routeGeojson={routeGeojson}
            lastKnownPosition={null}
            className={className}
          />
        </Suspense>
      ) : (
        <div
          className={`flex flex-col items-center justify-center gap-2 bg-muted/30 p-6 text-center ${className}`}
        >
          <Navigation className="h-5 w-5 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {copy.state.mapNoCoordinates}
          </p>
        </div>
      )}
      {showRouteLegend ? (
        <div className="flex flex-wrap gap-4 border-t px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-primary" aria-hidden />
            {copy.label.mapLegendActual}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-4 border-t-2 border-dashed border-muted-foreground/70"
              aria-hidden
            />
            {copy.label.mapLegendPlanned}
          </span>
        </div>
      ) : null}
    </div>
  );
}
