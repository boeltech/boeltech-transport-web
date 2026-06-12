/**
 * Correlación parada ↔ cargas para UI transparente durante el seguimiento.
 */

import {
  CargoStatus,
  StopType,
  type CargoMovement,
  type CargoStatusType,
  type StopTypeValue,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";

import { hasUnresolvedCargoAtStop } from "./trackingCargoGating";

export type StopCargoLink = {
  cargo: TripCargo;
  movementType: "pickup" | "delivery";
  movement: CargoMovement;
};

function sortStops(stops: readonly TripStop[]): TripStop[] {
  return [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
}

function hasStopType(
  stopType: TripStop["stopType"],
  target: StopTypeValue,
): boolean {
  const types = Array.isArray(stopType) ? stopType : [stopType];
  return types.includes(target);
}

export function isLoadStop(stop: TripStop): boolean {
  return (
    hasStopType(stop.stopType, StopType.PICKUP) ||
    hasStopType(stop.stopType, StopType.ORIGIN)
  );
}

export function isUnloadStop(stop: TripStop): boolean {
  return (
    hasStopType(stop.stopType, StopType.DELIVERY) ||
    hasStopType(stop.stopType, StopType.DESTINATION)
  );
}

export function findTripDestinationStop(
  orderedStops: readonly TripStop[],
): TripStop | undefined {
  return sortStops(orderedStops).find((stop) =>
    hasStopType(stop.stopType, StopType.DESTINATION),
  );
}

export function isTripDestinationStop(
  stop: TripStop,
  orderedStops: readonly TripStop[],
): boolean {
  const destination = findTripDestinationStop(orderedStops);
  return destination?.id === stop.id;
}

function isCargoTerminalStatus(status: CargoStatusType): boolean {
  return (
    status === CargoStatus.DELIVERED ||
    status === CargoStatus.RETURNED ||
    status === CargoStatus.CANCELLED
  );
}

function hasCargoBeenPickedUp(cargo: TripCargo): boolean {
  if (cargo.pickedUpAt != null) return true;
  return (cargo.movements ?? []).some(
    (movement) => movement.movementType === "pickup",
  );
}

function getRelevantMovementTypesForStop(
  stop: TripStop,
): Array<"pickup" | "delivery"> {
  const load = isLoadStop(stop);
  const unload = isUnloadStop(stop);
  if (load && !unload) return ["pickup"];
  if (unload && !load) return ["delivery"];
  return ["pickup", "delivery"];
}

function synthesizeDeliveryMovement(
  stop: TripStop,
  orderedStops: readonly TripStop[],
): CargoMovement {
  const sorted = sortStops(orderedStops);
  const stopArrayIndex = sorted.findIndex((item) => item.id === stop.id);
  return {
    movementType: "delivery",
    stopId: stop.id,
    stopIndex: stopArrayIndex >= 0 ? stopArrayIndex : stop.sequenceOrder,
    completedAt: null,
    weight: null,
    units: null,
    notes: null,
  };
}

function sortStopCargoLinks(links: StopCargoLink[]): StopCargoLink[] {
  return [...links].sort((a, b) => {
    if (a.movementType !== b.movementType) {
      return a.movementType === "pickup" ? -1 : 1;
    }
    return a.cargo.description.localeCompare(b.cargo.description, "es");
  });
}

/**
 * Resuelve la parada de un movimiento (stopId, sequenceOrder o índice 0-based en ruta).
 * Alineado con getStopLabelForCargo en tripCargoDetailHelpers.
 */
export function resolveStopForMovement(
  movement: Pick<CargoMovement, "stopId" | "stopIndex">,
  orderedStops: readonly TripStop[],
): TripStop | undefined {
  if (orderedStops.length === 0) return undefined;

  if (movement.stopId?.trim()) {
    const byId = orderedStops.find((stop) => stop.id === movement.stopId);
    if (byId) return byId;
  }

  const sorted = sortStops(orderedStops);

  const byArrayIndex = sorted[movement.stopIndex];
  if (byArrayIndex) return byArrayIndex;

  return sorted.find((stop) => stop.sequenceOrder === movement.stopIndex);
}

function movementMatchesStop(
  movement: CargoMovement,
  stop: TripStop,
  orderedStops: readonly TripStop[],
): boolean {
  const resolved = resolveStopForMovement(movement, orderedStops);
  return resolved?.id === stop.id;
}

function appendImplicitDeliveryLinks(
  stop: TripStop,
  cargos: readonly TripCargo[],
  routeStops: readonly TripStop[],
  links: StopCargoLink[],
  linkedCargoIds: Set<string>,
): void {
  if (!isUnloadStop(stop)) return;

  for (const cargo of cargos) {
    if (linkedCargoIds.has(cargo.id)) continue;
    if (isCargoTerminalStatus(cargo.status)) continue;
    if (cargo.status !== CargoStatus.IN_TRANSIT) continue;

    const deliveryMovement = cargo.movements?.find(
      (movement) => movement.movementType === "delivery",
    );

    if (deliveryMovement) {
      const resolved = resolveStopForMovement(deliveryMovement, routeStops);
      if (resolved && resolved.id !== stop.id) continue;
      if (!isTripDestinationStop(stop, routeStops)) continue;
      links.push({
        cargo,
        movementType: "delivery",
        movement: deliveryMovement,
      });
      linkedCargoIds.add(cargo.id);
      continue;
    }

    if (
      isTripDestinationStop(stop, routeStops) &&
      hasCargoBeenPickedUp(cargo)
    ) {
      links.push({
        cargo,
        movementType: "delivery",
        movement: synthesizeDeliveryMovement(stop, routeStops),
      });
      linkedCargoIds.add(cargo.id);
    }
  }
}

/** Cargas con movimiento pickup o delivery en esta parada. */
export function getStopCargoLinks(
  stop: TripStop,
  cargos: readonly TripCargo[],
  orderedStops: readonly TripStop[] = [],
): StopCargoLink[] {
  const routeStops = orderedStops.length > 0 ? orderedStops : [stop];
  const allowedTypes = getRelevantMovementTypesForStop(stop);
  const links: StopCargoLink[] = [];
  const linkedCargoIds = new Set<string>();

  for (const cargo of cargos) {
    for (const movement of cargo.movements ?? []) {
      if (!allowedTypes.includes(movement.movementType)) continue;
      if (!movementMatchesStop(movement, stop, routeStops)) continue;
      links.push({
        cargo,
        movementType: movement.movementType,
        movement,
      });
      linkedCargoIds.add(cargo.id);
    }
  }

  appendImplicitDeliveryLinks(
    stop,
    cargos,
    routeStops,
    links,
    linkedCargoIds,
  );

  return sortStopCargoLinks(links);
}

export function hasPendingMovementAtStop(
  stop: TripStop,
  cargos: readonly TripCargo[],
  orderedStops: readonly TripStop[] = [],
): boolean {
  return hasUnresolvedCargoAtStop(stop, cargos, orderedStops);
}
