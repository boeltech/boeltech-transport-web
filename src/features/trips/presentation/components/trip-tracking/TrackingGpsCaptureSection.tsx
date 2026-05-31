import { useState } from "react";
import { Crosshair, Loader2, MapPin, Navigation } from "lucide-react";

import type { TripStop } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";

import {
  coordsFromStop,
  formatTrackingCoords,
  readBrowserGeolocation,
  type TrackingGpsCapture,
} from "./trackingGpsCapture";

type TrackingGpsCaptureSectionProps = {
  stop?: Pick<TripStop, "latitude" | "longitude"> | null;
  value: TrackingGpsCapture | null;
  onChange: (value: TrackingGpsCapture | null) => void;
  disabled?: boolean;
};

export function TrackingGpsCaptureSection({
  stop,
  value,
  onChange,
  disabled = false,
}: TrackingGpsCaptureSectionProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopCoords = stop ? coordsFromStop(stop) : null;

  const handleBrowserLocation = async () => {
    setError(null);
    setIsLocating(true);
    try {
      const coords = await readBrowserGeolocation();
      onChange(coords);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de geolocalización");
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
      <Label className="text-sm">Ubicación del evento (opcional)</Label>
      <p className="text-xs text-muted-foreground">
        Mejora la trazabilidad operativa. Puedes usar el GPS del dispositivo o las
        coordenadas ya guardadas en la parada.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleBrowserLocation}
          disabled={disabled || isLocating}
        >
          {isLocating ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Crosshair className="mr-2 h-3.5 w-3.5" />
          )}
          Mi ubicación
        </Button>
        {stopCoords ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(stopCoords)}
            disabled={disabled}
          >
            <MapPin className="mr-2 h-3.5 w-3.5" />
            Coords. de parada
          </Button>
        ) : null}
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            disabled={disabled}
          >
            Quitar
          </Button>
        ) : null}
      </div>

      {value ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            <Navigation className="mr-1 h-3 w-3" />
            {formatTrackingCoords(value.latitude, value.longitude)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {value.source === "browser" ? "Dispositivo" : "Parada"}
            {value.accuracyMeters != null
              ? ` · ~${value.accuracyMeters} m`
              : null}
          </span>
        </div>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
