import type {
  CreateTrackingEventInput,
  TripStop,
} from "@features/trips/domain";
import { StopStatus } from "@features/trips/domain";

/**
 * Intención explícita en el sheet de despacho (PD6 / D4).
 * - `at_dock`: ya en andén → batch dispatch + llegada origen (T-BATCH).
 * - `en_route`: va en camino → solo `PATCH …/start` (T-START).
 */
export type DispatchLocationIntent = "at_dock" | "en_route";

/**
 * Señal barata origen≈base/sucursal (sin geo inventada):
 * hay `originBranchId` y la parada origen no está ligada a un cliente
 * (andén propio / cross-dock típico).
 *
 * Sin señal fiable → `en_route` (default documentado; evita auto-llegada).
 */
export function suggestDefaultDispatchLocationIntent(input: {
  originBranchId?: string | null;
  originStop?: Pick<TripStop, "clientId"> | null;
}): DispatchLocationIntent {
  const branchId = input.originBranchId?.trim();
  const hasClient = Boolean(input.originStop?.clientId?.trim());
  if (branchId && !hasClient) return "at_dock";
  return "en_route";
}

/** PD7: llegada ya registrada (app u office) — no re-enviar `stop_arrived`. */
export function originStopAlreadyArrived(
  originStop?: Pick<TripStop, "actualArrival" | "status"> | null,
): boolean {
  if (!originStop) return false;
  if (originStop.actualArrival != null) return true;
  return (
    originStop.status === StopStatus.IN_PROGRESS ||
    originStop.status === StopStatus.COMPLETED
  );
}

export type BuildAtDockDispatchBatchInput = {
  originStopId: string;
  occurredAtIso: string;
  mileage: number;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  dispatchIdempotencyKey: string;
  arriveIdempotencyKey: string;
};

/**
 * Payload batch «Despachar en origen» (T-BATCH).
 * Orden: `trip_dispatched` luego `stop_arrived`. Nunca `trip_departed`.
 */
export function buildAtDockDispatchBatchEvents(
  input: BuildAtDockDispatchBatchInput,
): CreateTrackingEventInput[] {
  const gps = {
    ...(input.latitude != null ? { latitude: input.latitude } : {}),
    ...(input.longitude != null ? { longitude: input.longitude } : {}),
    ...(input.accuracyMeters != null
      ? { accuracyMeters: input.accuracyMeters }
      : {}),
  };

  return [
    {
      eventType: "trip_dispatched",
      occurredAt: input.occurredAtIso,
      mileage: input.mileage,
      idempotencyKey: input.dispatchIdempotencyKey,
      capturedVia: "web",
      ...gps,
    },
    {
      eventType: "stop_arrived",
      stopId: input.originStopId,
      occurredAt: input.occurredAtIso,
      idempotencyKey: input.arriveIdempotencyKey,
      capturedVia: "web",
      ...gps,
    },
  ];
}
