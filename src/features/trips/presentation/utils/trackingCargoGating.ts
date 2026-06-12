/**
 * Adapter web → reglas de gating de cargas en seguimiento (@boeltech/cfdi-domain).
 */

import {
  canOperateCargoAtStop as domainCanOperateCargoAtStop,
  getUnresolvedCargoLinksAtStop as domainGetUnresolvedCargoLinksAtStop,
  hasUnresolvedCargoAtStop as domainHasUnresolvedCargoAtStop,
  isStopVisitActive as domainIsStopVisitActive,
  type TrackingStopGatingLike,
  type TripCargoGatingLike,
} from "@boeltech/cfdi-domain/reglas/tracking-cargo-gating";
import type { TripCargo, TripStop, TripStatusType } from "@features/trips/domain";

type DomainTripStatus = Parameters<typeof domainIsStopVisitActive>[1];

function asDomainTripStatus(status: TripStatusType): DomainTripStatus {
  return status as DomainTripStatus;
}

function normalizeStopTypes(
  stopType: TripStop["stopType"],
): TrackingStopGatingLike["stopType"] {
  const types = Array.isArray(stopType) ? stopType : [stopType];
  return types as TrackingStopGatingLike["stopType"];
}

export function mapTripStopToGatingLike(stop: TripStop): TrackingStopGatingLike {
  return {
    id: stop.id,
    sequenceOrder: stop.sequenceOrder,
    stopType: normalizeStopTypes(stop.stopType),
    actualArrival: stop.actualArrival,
    actualDeparture: stop.actualDeparture,
  };
}

export function mapTripCargoToGatingLike(cargo: TripCargo): TripCargoGatingLike {
  return {
    id: cargo.id,
    description: cargo.description,
    status: cargo.status,
    pickedUpAt: cargo.pickedUpAt,
    movements: (cargo.movements ?? []).map((movement) => ({
      movementType: movement.movementType,
      stopId: movement.stopId,
      stopIndex: movement.stopIndex,
    })),
  };
}

export function isStopVisitActive(
  stop: TripStop,
  tripStatus: TripStatusType,
): boolean {
  return domainIsStopVisitActive(
    mapTripStopToGatingLike(stop),
    asDomainTripStatus(tripStatus),
  );
}

export function canOperateCargoAtStop(
  stop: TripStop,
  tripStatus: TripStatusType,
): boolean {
  return domainCanOperateCargoAtStop(
    mapTripStopToGatingLike(stop),
    asDomainTripStatus(tripStatus),
  );
}

export function hasUnresolvedCargoAtStop(
  stop: TripStop,
  cargos: readonly TripCargo[],
  orderedStops: readonly TripStop[],
): boolean {
  return domainHasUnresolvedCargoAtStop(
    mapTripStopToGatingLike(stop),
    cargos.map(mapTripCargoToGatingLike),
    orderedStops.map(mapTripStopToGatingLike),
  );
}

export function getUnresolvedCargoLinksAtStop(
  stop: TripStop,
  cargos: readonly TripCargo[],
  orderedStops: readonly TripStop[],
) {
  const gatingStop = mapTripStopToGatingLike(stop);
  const gatingCargos = cargos.map(mapTripCargoToGatingLike);
  const gatingStops = orderedStops.map(mapTripStopToGatingLike);
  return domainGetUnresolvedCargoLinksAtStop(
    gatingStop,
    gatingCargos,
    gatingStops,
  );
}

export type CargoBlockAtStop = {
  blocked: boolean;
  pendingCount: number;
  descriptions: string[];
};

export function getCargoBlockAtStop(
  stop: TripStop,
  cargos: readonly TripCargo[],
  orderedStops: readonly TripStop[],
): CargoBlockAtStop {
  const pending = getUnresolvedCargoLinksAtStop(stop, cargos, orderedStops);
  return {
    blocked: pending.length > 0,
    pendingCount: pending.length,
    descriptions: pending.map((link) => link.cargo.description),
  };
}

export function validateCargoBeforeDeparture(
  stop: TripStop,
  cargos: readonly TripCargo[],
  orderedStops: readonly TripStop[],
): string | null {
  const block = getCargoBlockAtStop(stop, cargos, orderedStops);
  if (!block.blocked) return null;
  const joined =
    block.descriptions.length <= 3
      ? block.descriptions.join(", ")
      : `${block.descriptions.slice(0, 3).join(", ")} y ${block.descriptions.length - 3} más`;
  return `Completa las acciones de carga pendientes: ${joined}`;
}
