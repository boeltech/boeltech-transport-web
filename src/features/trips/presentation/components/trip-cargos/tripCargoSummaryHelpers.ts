import type { TripCargo, TripStop } from "@features/trips/domain";

import { getCargoPlanningStops, getCargoWeightKg } from "./tripCargoDetailHelpers";

export type CargoYardCounts = {
  inTransit: number;
  delivered: number;
};

/** Conteos Operate de patio (artboard card 3). */
export function countCargoYardStatus(
  cargos: readonly TripCargo[],
): CargoYardCounts {
  let inTransit = 0;
  let delivered = 0;
  for (const cargo of cargos) {
    if (cargo.status === "in_transit") inTransit += 1;
    else if (cargo.status === "delivered") delivered += 1;
  }
  return { inTransit, delivered };
}

export function sumCargoUnits(cargos: readonly TripCargo[]): number {
  return cargos.reduce((sum, cargo) => {
    const units = cargo.units;
    if (units == null || units <= 0) return sum;
    return sum + units;
  }, 0);
}

export function sumCargoWeightKg(cargos: readonly TripCargo[]): number {
  return cargos.reduce((sum, cargo) => sum + getCargoWeightKg(cargo), 0);
}

/**
 * Etiqueta de recogida compartida para el subtexto «Recogidas en …».
 * Si hay varias recogidas distintas, null (el caller usa peso total).
 */
export function resolveSharedPickupLabel(
  cargos: readonly TripCargo[],
  orderedStops: readonly TripStop[],
): string | null {
  const labels = new Set<string>();
  for (const cargo of cargos) {
    const planning = getCargoPlanningStops(cargo, orderedStops);
    if (planning.pickupLabel) labels.add(planning.pickupLabel);
  }
  if (labels.size !== 1) return null;
  return [...labels][0] ?? null;
}
