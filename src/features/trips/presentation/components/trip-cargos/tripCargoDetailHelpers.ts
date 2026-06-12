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
  return `#${stop.sequenceOrder} ${stop.locationName || stop.city}`;
}

export function isCargoHazmat(cargo: TripCargo): boolean {
  return cargo.hazardousMaterial === true || cargo.requiresHazmat;
}
