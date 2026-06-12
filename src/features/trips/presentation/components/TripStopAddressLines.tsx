import type { TripStop } from "@features/trips/domain";
import { cn } from "@shared/lib/utils/cn";
import { useTripStopLocalityLine } from "../hooks/useTripStopLocalityLine";
import {
  formatStopDisplayPrimaryLine,
  formatStopDisplayStreetLine,
} from "../uiHelpers";

interface TripStopAddressLinesProps {
  stop: TripStop;
  primaryClassName?: string;
  secondaryClassName?: string;
  referenceClassName?: string;
}

export function TripStopAddressLines({
  stop,
  primaryClassName = "text-sm font-medium",
  secondaryClassName = "text-sm text-muted-foreground",
  referenceClassName = "text-xs text-muted-foreground",
}: TripStopAddressLinesProps) {
  const primary = formatStopDisplayPrimaryLine(stop);
  const streetLine = formatStopDisplayStreetLine(stop);
  const locality = useTripStopLocalityLine(stop);
  const reference = stop.reference?.trim();

  return (
    <>
      <p className={primaryClassName}>{primary}</p>
      {streetLine ? <p className={secondaryClassName}>{streetLine}</p> : null}
      {stop.colonia?.trim() ? (
        <p className={secondaryClassName}>{stop.colonia.trim()}</p>
      ) : null}
      {locality ? <p className={secondaryClassName}>{locality}</p> : null}
      {reference ? (
        <p className={referenceClassName}>Referencia: {reference}</p>
      ) : null}
    </>
  );
}

/** Una sola línea: calle/número + colonia + ciudad/estado/CP (sin repetir `locationName`). */
export function TripStopAddressSingleLine({
  stop,
  className,
  hideWhenEmpty = false,
}: {
  stop: TripStop;
  className?: string;
  /** Si true, no renderiza cuando no hay segmentos de domicilio (p. ej. solo nombre de lugar arriba). */
  hideWhenEmpty?: boolean;
}) {
  const locality = useTripStopLocalityLine(stop);
  const streetPart = stop.locationName?.trim()
    ? formatStopDisplayStreetLine(stop)
    : formatStopDisplayPrimaryLine(stop);
  const colonia = stop.colonia?.trim() || null;
  const parts = [streetPart, colonia, locality].filter(
    (p) => p != null && String(p).trim() !== "",
  );
  const line = parts.join(", ");

  if (!line) {
    if (hideWhenEmpty) return null;
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>—</p>
    );
  }

  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{line}</p>
  );
}

/** Nombre del lugar + domicilio en una línea (patrón cards de Ruta en detalle de viaje). */
export function TripDetailRouteStopAddress({
  stop,
}: {
  stop: TripStop;
}) {
  const locationName = stop.locationName?.trim();
  const reference = stop.reference?.trim();

  return (
    <div className="space-y-1">
      {locationName ? (
        <p className="truncate text-sm font-semibold">{locationName}</p>
      ) : null}
      <TripStopAddressSingleLine
        stop={stop}
        hideWhenEmpty={Boolean(locationName)}
        className={cn(
          "truncate",
          locationName ? "text-xs text-muted-foreground" : "text-sm font-semibold",
        )}
      />
      {reference ? (
        <p className="text-xs text-muted-foreground">Referencia: {reference}</p>
      ) : null}
    </div>
  );
}
