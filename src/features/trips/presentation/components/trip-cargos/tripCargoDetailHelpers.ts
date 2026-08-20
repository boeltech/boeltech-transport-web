import type {
  CargoStatusType,
  CreateCargoInput,
  TripCargo,
  TripStop,
} from "@features/trips/domain";

import { cargoCopy } from "../../copy/tripDetail/cargoCopy";
import { resolveStopForMovement } from "../../utils/stopCargoCorrelation";

export type AttachStopIdsResult =
  | { ok: true; cargo: CreateCargoInput }
  | { ok: false; unresolvedStopIndexes: number[] };

/**
 * Adjunta stopId UUID a cada movement usando el índice 0-based de orderedStops
 * (misma semántica que CargoMovementSheet en el detalle).
 */
export function attachStopIdsToCreateCargoMovements(
  cargo: CreateCargoInput,
  orderedStops: readonly TripStop[],
): AttachStopIdsResult {
  const movements = cargo.movements;
  if (!movements?.length) {
    return { ok: true, cargo };
  }

  const unresolvedStopIndexes: number[] = [];
  const enriched = movements.map((movement) => {
    const stop = orderedStops[movement.stopIndex];
    const stopId = stop?.id?.trim();
    if (!stopId) {
      unresolvedStopIndexes.push(movement.stopIndex);
      return movement;
    }
    return { ...movement, stopId };
  });

  if (unresolvedStopIndexes.length > 0) {
    return { ok: false, unresolvedStopIndexes };
  }

  return { ok: true, cargo: { ...cargo, movements: enriched } };
}

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

export function isCargoInsured(cargo: TripCargo): boolean {
  const hasInsurer = Boolean(cargo.aseguraCarga?.trim());
  const hasPolicy = Boolean(cargo.polizaCarga?.trim());
  const hasValue =
    cargo.declaredValue != null && Number(cargo.declaredValue) > 0;
  return hasInsurer || hasPolicy || hasValue;
}

export function getCargoWeightKg(cargo: TripCargo): number {
  return cargo.weightInKg ?? cargo.weight ?? 0;
}

function labelForResolvedStop(
  stop: TripStop,
  movementStopIndex: number,
  orderedStops: readonly TripStop[],
): string {
  const sorted = [...orderedStops].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder,
  );
  const idx = sorted.findIndex((item) => item.id === stop.id);
  return getStopLabelForCargo(idx >= 0 ? idx : movementStopIndex, sorted);
}

/** Etiquetas de planeación recogida / entrega para lista y panel. */
export function getCargoPlanningStops(
  cargo: TripCargo,
  orderedStops: readonly TripStop[],
): {
  pickupLabel: string | null;
  deliveryLabels: string[];
  hasPickupMovement: boolean;
  hasDeliveryMovement: boolean;
  unresolvedMovementCount: number;
} {
  const movements = cargo.movements ?? [];
  const pickups = movements.filter((m) => m.movementType === "pickup");
  const deliveries = movements.filter((m) => m.movementType === "delivery");

  let unresolvedMovementCount = 0;
  const pickupLabels: string[] = [];
  for (const movement of pickups) {
    const stop = resolveStopForMovement(movement, orderedStops);
    if (!stop) {
      unresolvedMovementCount += 1;
      continue;
    }
    pickupLabels.push(
      labelForResolvedStop(stop, movement.stopIndex, orderedStops),
    );
  }

  const deliveryLabels: string[] = [];
  for (const movement of deliveries) {
    const stop = resolveStopForMovement(movement, orderedStops);
    if (!stop) {
      unresolvedMovementCount += 1;
      continue;
    }
    deliveryLabels.push(
      labelForResolvedStop(stop, movement.stopIndex, orderedStops),
    );
  }

  return {
    pickupLabel: pickupLabels[0] ?? null,
    deliveryLabels,
    hasPickupMovement: pickups.length > 0,
    hasDeliveryMovement: deliveries.length > 0,
    unresolvedMovementCount,
  };
}

export function formatCargoRouteLine(
  cargo: TripCargo,
  orderedStops: readonly TripStop[],
): string {
  const planning = getCargoPlanningStops(cargo, orderedStops);
  const pickup = planning.pickupLabel ?? cargoCopy.state.missingPickup;
  const delivery =
    planning.deliveryLabels.length > 0
      ? planning.deliveryLabels.join(", ")
      : cargoCopy.state.missingDelivery;
  return cargoCopy.format.routeSummary(pickup, delivery);
}
