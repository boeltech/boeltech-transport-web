import { lazy, Suspense, useMemo } from "react";
import { MapPinned, Navigation } from "lucide-react";

import config from "@shared/config/env";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import type { TrackingEvent, TrackingTimelineMapPosition, TripStop } from "@features/trips/domain";

import { formatTrackingCoords } from "./trip-tracking/trackingGpsCapture";
import { buildStopMarkers as buildMapStopMarkers } from "./trip-tracking/trackingMapHelpers";

const TripTrackingMapView = lazy(() =>
  import("./trip-tracking/TripTrackingMapView").then((mod) => ({
    default: mod.TripTrackingMapView,
  })),
);

interface TripTrackingMapProps {
  stops: TripStop[];
  events?: TrackingEvent[];
  routeGeojson?: Record<string, unknown> | null;
  lastKnownPosition: TrackingTimelineMapPosition | null;
}

function TripTrackingMapFallbackList({
  stops,
  lastKnownPosition,
}: Pick<TripTrackingMapProps, "stops" | "lastKnownPosition">) {
  const stopMarkers = buildMapStopMarkers(stops);

  return (
    <>
      <div className="rounded-lg border bg-muted/20 p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Ultima posicion conocida
        </p>
        {lastKnownPosition ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {formatTrackingCoords(
                lastKnownPosition.latitude,
                lastKnownPosition.longitude,
              )}
            </Badge>
            {lastKnownPosition.accuracyMeters != null ? (
              <span className="text-xs text-muted-foreground">
                Precision ~{Math.round(lastKnownPosition.accuracyMeters)} m
              </span>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Aun no hay eventos con coordenadas registradas.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Coordenadas por parada
        </p>
        {stopMarkers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin paradas con coordenadas para trazar.
          </p>
        ) : (
          stopMarkers.map((stop) => (
            <div
              key={stop.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {stop.order}. {stop.label}
                </p>
                {stop.sublabel ? (
                  <p className="text-xs text-muted-foreground truncate">{stop.sublabel}</p>
                ) : null}
              </div>
              <Badge variant="outline" className="shrink-0 font-mono text-xs">
                {formatTrackingCoords(stop.latitude, stop.longitude)}
              </Badge>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export function TripTrackingMap({
  stops,
  events = [],
  routeGeojson = null,
  lastKnownPosition,
}: TripTrackingMapProps) {
  const mapboxToken = config.geolocation.mapboxPublicToken;
  const hasMapData = useMemo(() => {
    const stopMarkers = buildMapStopMarkers(stops);
    const hasEvents = events.some(
      (event) => event.latitude != null && event.longitude != null,
    );
    return (
      stopMarkers.length > 0 || hasEvents || lastKnownPosition != null || !!routeGeojson
    );
  }, [stops, events, lastKnownPosition, routeGeojson]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-primary" />
          Mapa operativo
        </CardTitle>
        <CardDescription>
          Ubicación de paradas y eventos con GPS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mapboxToken && hasMapData ? (
          <Suspense
            fallback={<Skeleton className="h-72 w-full rounded-md" aria-label="Cargando mapa" />}
          >
            <TripTrackingMapView
              token={mapboxToken}
              stops={stops}
              events={events}
              routeGeojson={routeGeojson}
              lastKnownPosition={lastKnownPosition}
            />
          </Suspense>
        ) : null}

        {!mapboxToken || !hasMapData ? (
          <TripTrackingMapFallbackList
            stops={stops}
            lastKnownPosition={lastKnownPosition}
          />
        ) : null}

        {mapboxToken && hasMapData ? (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                n
              </span>
              Parada
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-warning" />
              Evento con GPS
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-destructive" />
              Ultima posicion
            </span>
            {routeGeojson ? (
              <span className="inline-flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5" />
                Ruta planificada
              </span>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
