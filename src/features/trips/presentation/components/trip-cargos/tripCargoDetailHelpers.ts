import type { TripCargo, TripStop } from "@features/trips/domain";

import { cargoCopy } from "../../copy/tripDetail/cargoCopy";

export function getStopLabelForCargo(
  stopIndex: number,
  orderedStops: TripStop[],
): string {
  const stop =
    orderedStops.find((s) => s.sequenceOrder === stopIndex) ??
    orderedStops[stopIndex];
  if (!stop) return cargoCopy.format.stopLabelFallback(stopIndex);
  return `#${stop.sequenceOrder} ${stop.locationName || stop.city}`;
}

export function isCargoHazmat(cargo: TripCargo): boolean {
  return cargo.hazardousMaterial === true || cargo.requiresHazmat;
}
