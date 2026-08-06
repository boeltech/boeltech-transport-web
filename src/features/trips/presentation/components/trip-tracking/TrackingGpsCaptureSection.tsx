import { useState } from "react";
import { Crosshair, Loader2, MapPin, Navigation } from "lucide-react";

import type { TripStop } from "@features/trips/domain";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";

import { trackingCopy } from "../../copy";
import {
  coordsFromStop,
  readBrowserGeolocation,
  type TrackingGpsCapture,
} from "./trackingGpsCapture";

type TrackingGpsCaptureSectionProps = {
  stop?: Pick<TripStop, "latitude" | "longitude"> | null;
  value: TrackingGpsCapture | null;
  onChange: (value: TrackingGpsCapture | null) => void;
  disabled?: boolean;
  /**
   * `quiet`: sin card — secundaria en sheets lean (p. ej. Iniciar viaje).
   * No cambia el contrato de captura GPS.
   */
  variant?: "default" | "quiet";
};

export function TrackingGpsCaptureSection({
  stop,
  value,
  onChange,
  disabled = false,
  variant = "default",
}: TrackingGpsCaptureSectionProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopCoords = stop ? coordsFromStop(stop) : null;
  const copy = trackingCopy;
  const isQuiet = variant === "quiet";

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
    <div
      className={cn(
        "space-y-2",
        !isQuiet && "rounded-md border bg-muted/20 p-3",
      )}
    >
      <Label className={cn("text-sm", isQuiet && "text-muted-foreground")}>
        {isQuiet
          ? copy.sheet.locationOptionalQuiet
          : copy.sheet.locationOptional}
      </Label>
      {!isQuiet ? (
        <p className="text-xs text-muted-foreground">{copy.sheet.locationHint}</p>
      ) : null}

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
          {copy.sheet.useMyLocation}
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
            {copy.sheet.useStopLocation}
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
            {copy.sheet.clearLocation}
          </Button>
        ) : null}
      </div>

      {value ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs font-normal">
            <Navigation className="mr-1 h-3 w-3" />
            {copy.state.locationSaved}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {value.source === "browser"
              ? copy.label.locationFromDevice
              : copy.label.locationFromStop}
          </span>
        </div>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
