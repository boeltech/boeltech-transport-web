import { StopType } from "@features/trips";

import {
  formatWizardStopAddressLine,
  formatWizardStopCityLine,
} from "./wizardStopFormat";
import type { TripCargoFormValues, TripStopFormValues } from "./validation";

export interface SummaryPickupStopInfo {
  index: number;
  address: string;
  city: string;
  locationName?: string;
  clientName?: string;
  category: "origin" | "waypoint" | "destination";
}

export function buildSummaryPickupStops(
  stops: TripStopFormValues[],
  clients: Array<{ id: string; legalName: string }>,
): SummaryPickupStopInfo[] {
  if (!stops.length) return [];

  return stops.flatMap((stop, index) => {
    if (!stop.stopType.includes(StopType.PICKUP)) return [];

    const hasOrigin = stop.stopType.includes(StopType.ORIGIN);
    const hasDestination = stop.stopType.includes(StopType.DESTINATION);

    let category: SummaryPickupStopInfo["category"] = "waypoint";
    if (hasOrigin) category = "origin";
    else if (hasDestination) category = "destination";

    const client = stop.clientId
      ? clients.find((item) => item.id === stop.clientId)
      : undefined;

    return [
      {
        index,
        address: formatWizardStopAddressLine(stop),
        city: formatWizardStopCityLine(stop),
        locationName: stop.locationName,
        clientName: client?.legalName,
        category,
      },
    ];
  });
}

export function getCargosForPickupStop(
  cargos: TripCargoFormValues[],
  stopIndex: number,
): TripCargoFormValues[] {
  return cargos.filter((cargo) => {
    const pickupMovement = cargo.movements?.find((m) => m.movementType === "pickup");
    return pickupMovement?.stopIndex === stopIndex;
  });
}

export function formatSummaryStopHeaderLabel(
  stopIndex: number,
  stops: TripStopFormValues[],
): string {
  const stop = stops[stopIndex];
  if (!stop) return `Parada ${stopIndex + 1}`;
  const place = stop.locationName || formatWizardStopAddressLine(stop);
  return `Parada ${stopIndex + 1} · ${place}`;
}
