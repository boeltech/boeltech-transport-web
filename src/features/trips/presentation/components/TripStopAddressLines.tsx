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

/** Una sola línea: calle/número + colonia + ciudad/estado/CP (misma resolución que Origen/Destino en Resumen). */
export function TripStopAddressSingleLine({
  stop,
  className,
}: {
  stop: TripStop;
  className?: string;
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

  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {line || "—"}
    </p>
  );
}
