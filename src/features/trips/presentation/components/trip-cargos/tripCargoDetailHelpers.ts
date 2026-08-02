import type { CargoStatusType, TripCargo, TripStop } from "@features/trips/domain";

import { cargoCopy } from "../../copy/tripDetail/cargoCopy";

export function getCargoStatusVariant(
  status: CargoStatusType,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "delivered":
      return "default";
    case "in_transit":
      return "secondary";
    case "cancelled":
    case "returned":
      return "destructive";
    default:
      return "outline";
  }
}

/** Orden visible 1-based en la ruta ordenada (Parada #1 = origen). */
export function getStopDisplayOrder(
  stop: TripStop,
  orderedStops: readonly TripStop[],
): number {
  const sorted = [...orderedStops].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder,
  );
  const index = sorted.findIndex((s) => s.id === stop.id);
  if (index >= 0) return index + 1;
  return stop.sequenceOrder + 1;
}

export function getStopLabelForCargo(
  stopIndex: number,
  orderedStops: TripStop[],
): string {
  const sorted = [...orderedStops].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder,
  );
  const stop =
    sorted[stopIndex] ??
    sorted.find((s) => s.sequenceOrder === stopIndex) ??
    orderedStops[stopIndex];
  if (!stop) return cargoCopy.format.stopLabelFallback(stopIndex);
  const displayOrder = getStopDisplayOrder(stop, sorted);
  return `#${displayOrder} ${stop.locationName || stop.city}`;
}

export function isCargoHazmat(cargo: TripCargo): boolean {
  return cargo.hazardousMaterial === true || cargo.requiresHazmat;
}
