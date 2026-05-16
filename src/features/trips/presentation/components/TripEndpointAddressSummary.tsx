import { InfoRow } from "@shared/ui/data-display";
import type { TripStop } from "@features/trips/domain";
import { useTripStopLocalityLine } from "../hooks/useTripStopLocalityLine";
import {
  formatStopDisplayPrimaryLine,
  formatStopDisplayStreetLine,
} from "../uiHelpers";

interface TripEndpointAddressSummaryProps {
  stop: TripStop;
}

export function TripEndpointAddressSummary({
  stop,
}: TripEndpointAddressSummaryProps) {
  const primary = formatStopDisplayPrimaryLine(stop);
  const streetLine = formatStopDisplayStreetLine(stop);
  const locality = useTripStopLocalityLine(stop);
  const reference = stop.reference?.trim();

  return (
    <>
      <InfoRow
        variant="inline"
        label="Dirección"
        value={primary !== "Sin dirección" ? primary : "—"}
      />
      {streetLine ? (
        <InfoRow variant="inline" label="Calle y número" value={streetLine} />
      ) : null}
      {stop.colonia?.trim() ? (
        <InfoRow variant="inline" label="Colonia" value={stop.colonia.trim()} />
      ) : null}
      <InfoRow
        variant="inline"
        label="Ciudad / Estado / C.P."
        value={locality || "—"}
      />
      {reference ? (
        <InfoRow variant="inline" label="Referencia" value={reference} />
      ) : null}
    </>
  );
}
