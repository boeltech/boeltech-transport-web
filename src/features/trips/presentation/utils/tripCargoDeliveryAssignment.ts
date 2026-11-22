/**
 * F5d-c — adapter fino a predicados de entrega multi-unload del paquete.
 * No reimplementa reglas: solo mapea stops/cargos camelCase → gating del dominio.
 */

import {
  assertCargosDeliveryStopRequired,
  CARGO_DELIVERY_STOP_REQUIRED_CODE,
  countUnloadStops,
  hasDeliveryMovement,
  requiresExplicitDeliveryAssignment,
  type CargoStatus,
  type StopType,
} from "@boeltech/cfdi-domain";
import { isApiError } from "@shared/api/interceptors/error-handler";

import type { TripStop } from "@features/trips/domain";

export { CARGO_DELIVERY_STOP_REQUIRED_CODE };

export type DeliveryAssignmentStopLike = Pick<TripStop, "stopType">;

export type DeliveryAssignmentMovementLike = {
  movementType: string;
  stopIndex?: number;
};

export type DeliveryAssignmentCargoLike = {
  status: string;
  movements?: readonly DeliveryAssignmentMovementLike[] | null;
};

function mapStopType(
  stopType: TripStop["stopType"] | string | readonly string[],
): StopType[] {
  return (Array.isArray(stopType) ? stopType : [stopType]).map(
    (value) => String(value) as StopType,
  );
}

export function mapStopForDeliveryAssignment(
  stop: DeliveryAssignmentStopLike,
): { stopType: StopType[] } {
  return { stopType: mapStopType(stop.stopType) };
}

export function mapCargoForDeliveryAssignment(
  cargo: DeliveryAssignmentCargoLike,
): {
  status: CargoStatus;
  movements: { movementType: "pickup" | "delivery"; stopIndex: number }[];
} {
  return {
    status: cargo.status as CargoStatus,
    movements: (cargo.movements ?? []).map((movement, index) => ({
      movementType: movement.movementType as "pickup" | "delivery",
      stopIndex:
        typeof movement.stopIndex === "number" ? movement.stopIndex : index,
    })),
  };
}

/** Cuenta unloads canónicos (`delivery` | `destination`) vía paquete. */
export function countTripUnloadStops(
  stops: readonly DeliveryAssignmentStopLike[],
): number {
  return countUnloadStops(stops.map(mapStopForDeliveryAssignment));
}

export function cargoHasDeliveryMovement(
  cargo: Pick<DeliveryAssignmentCargoLike, "movements">,
): boolean {
  return hasDeliveryMovement(
    mapCargoForDeliveryAssignment({
      status: "pending",
      movements: cargo.movements,
    }),
  );
}

/**
 * True si unload≥2 y la carga activa no tiene delivery planificado.
 * F5a (unload&lt;2) → siempre false.
 */
export function cargoRequiresExplicitDeliveryAssignment(input: {
  unloadCount: number;
  cargo: DeliveryAssignmentCargoLike;
}): boolean {
  return requiresExplicitDeliveryAssignment({
    unloadCount: input.unloadCount,
    cargo: mapCargoForDeliveryAssignment(input.cargo),
  });
}

/**
 * Gap de conjunto (confirm/start / Planear retorno): alguna carga activa
 * exige delivery con ≥2 unloads.
 */
export function tripHasMultiUnloadDeliveryGap(
  stops: readonly DeliveryAssignmentStopLike[],
  cargos: readonly DeliveryAssignmentCargoLike[],
): boolean {
  const result = assertCargosDeliveryStopRequired({
    stops: stops.map(mapStopForDeliveryAssignment),
    cargos: cargos.map(mapCargoForDeliveryAssignment),
  });
  return !result.ok;
}

/** Copy gate Confirmar/Iniciar (PRD). */
export const MULTI_UNLOAD_DELIVERY_GATE_MESSAGE =
  "No se puede continuar: hay cargas sin entrega planificada." as const;

/**
 * Motivo UI para bloquear Iniciar cuando hay gap multi-unload.
 * `null` si no aplica.
 */
export function multiUnloadDeliveryBlockReason(
  stops: readonly DeliveryAssignmentStopLike[],
  cargos: readonly DeliveryAssignmentCargoLike[],
): string | null {
  if (!tripHasMultiUnloadDeliveryGap(stops, cargos)) return null;
  return MULTI_UNLOAD_DELIVERY_GATE_MESSAGE;
}

/** Toast/Alert cuando el API responde `CARGO_DELIVERY_STOP_REQUIRED`. */
export function resolveCargoDeliveryStopApiErrorMessage(
  error: unknown,
): string | null {
  if (
    isApiError(error) &&
    error.code === CARGO_DELIVERY_STOP_REQUIRED_CODE
  ) {
    return MULTI_UNLOAD_DELIVERY_GATE_MESSAGE;
  }
  return null;
}
