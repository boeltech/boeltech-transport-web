import {
  StopType,
  type CargoStatusType,
  type CreateCargoInput,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";

import { cargoCopy } from "../../copy/tripDetail/cargoCopy";
import { resolveStopForMovement } from "../../utils/stopCargoCorrelation";
import { hasStopType } from "../trip-route/tripRouteDetailHelpers";

/**
 * Parada tipo descarga (unload): `delivery` y/o `destination`.
 * Alineado con `toDeliverySheetStops` del tab Cargas y con `isUnloadStop` del API.
 */
export function isUnloadStopForCargo(stop: Pick<TripStop, "stopType">): boolean {
  return (
    hasStopType(stop.stopType, StopType.DELIVERY) ||
    hasStopType(stop.stopType, StopType.DESTINATION)
  );
}

/** Paradas de descarga del viaje en el orden recibido. */
export function listUnloadStops(
  orderedStops: readonly TripStop[],
): TripStop[] {
  return orderedStops.filter(isUnloadStopForCargo);
}

export function countUnloadStops(orderedStops: readonly TripStop[]): number {
  return listUnloadStops(orderedStops).length;
}

/**
 * CTA «Agregar entrega» en edición de mercancía: solo con ≥2 descargas
 * (CEO 2026-10-18). Con 1 sola (típicamente destino) el CTA se oculta.
 */
export function canShowAddDeliveryInCargoEdit(
  orderedStops: readonly TripStop[],
): boolean {
  return countUnloadStops(orderedStops) >= 2;
}

/** Códigos de error de mutación de cargas que la UI mapea a copy propio. */
export const CARGO_STOP_NOT_OPERABLE = "CARGO_STOP_NOT_OPERABLE" as const;

const NETWORK_ERROR_CODES = new Set([
  "NETWORK_ERROR",
  "TIMEOUT",
  "SERVICE_UNAVAILABLE",
]);

export type CargoErrorLike = {
  code?: string;
  message?: string;
};

/**
 * Toast de delete: 403 vs red vs genérico (PRD / F4).
 */
export function resolveCargoRemoveErrorToast(error: CargoErrorLike): {
  title: string;
  description?: string;
} {
  if (error.code === "FORBIDDEN") {
    return { title: cargoCopy.toast.cargoRemoveForbidden };
  }
  if (error.code != null && NETWORK_ERROR_CODES.has(error.code)) {
    return { title: cargoCopy.toast.cargoRemoveNetworkError };
  }
  const description = error.message?.trim();
  return {
    title: cargoCopy.toast.cargoRemoveError,
    description: description || undefined,
  };
}

/**
 * Mensaje usable cuando falla add/update/reassign por parada no operable u otro error.
 */
export function resolveCargoMutationErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error != null &&
    typeof error === "object" &&
    "code" in error &&
    (error as CargoErrorLike).code === CARGO_STOP_NOT_OPERABLE
  ) {
    return cargoCopy.toast.cargoStopNotOperable;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export type MissingDeliveryAlertModel = {
  body: string;
  /** Con ≥2 unload: editar puede «Agregar entrega». Con 1: no vender Editar. */
  showEditAction: boolean;
  showAddCargoAction: boolean;
  showGoToRouteAction: boolean;
};

/**
 * Alert «Falta entrega» coherente con gate ≥2 descargas (PRD D6 / F4)
 * y con default delivery 1 unload (F5): solo se muestra si el listado
 * aún trae cargos sin movement delivery (p. ej. ensure no sanó).
 */
export function resolveMissingDeliveryAlert(args: {
  count: number;
  canAddDeliveryInEdit: boolean;
  canEditStructural: boolean;
  canAppendCargo: boolean;
  hasGoToRoute: boolean;
}): MissingDeliveryAlertModel {
  const {
    count,
    canAddDeliveryInEdit,
    canEditStructural,
    canAppendCargo,
    hasGoToRoute,
  } = args;

  if (canAddDeliveryInEdit) {
    return {
      body: cargoCopy.alert.noDeliveryBody(count),
      showEditAction: canEditStructural && count > 0,
      showAddCargoAction: false,
      showGoToRouteAction: false,
    };
  }

  return {
    body: cargoCopy.alert.noDeliveryBodySingleUnload(count),
    showEditAction: false,
    showAddCargoAction: canAppendCargo,
    showGoToRouteAction: hasGoToRoute,
  };
}

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

/**
 * Carga ya cerrada en patio (o cancelada): los huecos de planeación
 * no son accionables ni deben competir con el status de ciclo de vida.
 */
export function isCargoPlanningGapMuted(
  status: CargoStatusType | TripCargo["status"],
): boolean {
  return (
    status === "delivered" ||
    status === "returned" ||
    status === "cancelled"
  );
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
  if (planning.deliveryLabels.length > 0) {
    return cargoCopy.format.routeSummary(
      pickup,
      planning.deliveryLabels.join(", "),
    );
  }
  // Terminal: no competir «Sin entrega» con Entregada/Devuelta/Cancelada.
  if (isCargoPlanningGapMuted(cargo.status)) {
    return pickup;
  }
  return cargoCopy.format.routeSummary(pickup, cargoCopy.state.missingDelivery);
}
