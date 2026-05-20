import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { MapPinned, Navigation } from "lucide-react";
import type { TrackingTimelineMapPosition, TripStop } from "@features/trips/domain";

interface TripTrackingMapProps {
  stops: TripStop[];
  lastKnownPosition: TrackingTimelineMapPosition | null;
}

function formatCoords(lat: number, lng: number) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function TripTrackingMap({ stops, lastKnownPosition }: TripTrackingMapProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-primary" />
          Mapa operativo (v1)
        </CardTitle>
        <CardDescription>
          Ubicaciones por parada y ultima posicion reportada. La linea de ruta
          se incorporara en una fase posterior.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Ultima posicion conocida
          </p>
          {lastKnownPosition ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {formatCoords(
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
          {stops.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin paradas disponibles para trazar.
            </p>
          ) : (
            stops.map((stop, index) => {
              const hasCoords =
                stop.latitude != null && stop.longitude != null;
              return (
                <div
                  key={stop.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {index + 1}. {stop.locationName || `Parada ${index + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {stop.city || stop.address}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {hasCoords ? (
                      <Badge variant="outline">
                        {formatCoords(stop.latitude!, stop.longitude!)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Navigation className="h-3.5 w-3.5" />
                        Sin coords
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
