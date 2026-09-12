import type {
  CreateStopInput,
  ReplanPendingStopInput,
  TripStop,
} from "@features/trips/domain";

import { mapStopToReplaceStopInput } from "../trip-detail-patch/mapStopToCreateStopInput";
import { syncCreateStopSegmentDistances } from "./buildReplaceStopsPayload";
import { isTripStopImmutableMidTrip } from "./isStopImmutableMidTrip";
import { getRouteStopCategory } from "./tripRouteDetailHelpers";

export type { ReplanPendingStopInput };

export function mapStopToReplanPendingInput(
  stop: TripStop,
): ReplanPendingStopInput {
  return {
    ...mapStopToReplaceStopInput(stop),
    id: stop.id,
  };
}

/**
 * Sincroniza `distanceFromPreviousKm` sobre el orden completo (incluye
 * inmutables como vecinos) y emite solo pending con `id`.
 * Misma regla Haversine×1,30 / manual que `syncCreateStopSegmentDistances`.
 */
export function toSyncedReplanPendingStops(
  orderedAfterMutation: readonly TripStop[],
): ReplanPendingStopInput[] {
  const synced = syncCreateStopSegmentDistances(
    orderedAfterMutation.map((stop) => mapStopToReplaceStopInput(stop)),
  );

  return orderedAfterMutation
    .map((stop, index) => ({
      ...synced[index]!,
      id: stop.id,
    }))
    .filter((_, index) => !isTripStopImmutableMidTrip(orderedAfterMutation[index]!));
}

/**
 * Construye el body `pending_stops` a partir de la lista CreateStopInput
 * (helpers de composer/replace) + paradas existentes, preservando `id` en modify
 * y omitiendo inmutables mid-trip.
 */
export function toReplanPendingStops(params: {
  next: CreateStopInput[];
  existing: readonly TripStop[];
  /** Si se edita una parada cuyo domicilio cambia, fuerza ese id. */
  editingStopId?: string | null;
}): ReplanPendingStopInput[] {
  const { next, existing, editingStopId = null } = params;
  const assigned = new Set<string>();
  const out: ReplanPendingStopInput[] = [];
  /** Misma ordenación que `finalizeReplaceStopsPayload` / `orderStopsForRouteLine`. */
  const existingInRouteOrder = orderExistingStopsForRouteLine(existing);

  const takeMatch = (candidate: TripStop | undefined): TripStop | undefined => {
    if (!candidate || assigned.has(candidate.id)) return undefined;
    if (isTripStopImmutableMidTrip(candidate)) {
      assigned.add(candidate.id);
      return undefined;
    }
    assigned.add(candidate.id);
    return candidate;
  };

  for (let index = 0; index < next.length; index++) {
    const input = next[index]!;
    const category = categoryFromCreateStop(input);

    let matched: TripStop | undefined;

    if (editingStopId && !assigned.has(editingStopId)) {
      const editing = existing.find((stop) => stop.id === editingStopId);
      if (editing && getRouteStopCategory(editing) === category) {
        // Posición en orden de ruta (origen→escalas→destino), no índice crudo de `existing`.
        if (
          existingInRouteOrder[index]?.id === editingStopId ||
          existing.filter((stop) => getRouteStopCategory(stop) === category)
            .length === 1
        ) {
          matched = takeMatch(editing);
        }
      }
    }

    if (!matched && category === "origin") {
      matched = takeMatch(
        existing.find((stop) => getRouteStopCategory(stop) === "origin"),
      );
    } else if (!matched && category === "destination") {
      matched = takeMatch(
        existing.find((stop) => getRouteStopCategory(stop) === "destination"),
      );
    } else if (!matched) {
      const addressId = input.addressId?.trim() || null;
      matched = takeMatch(
        existing.find((stop) => {
          if (getRouteStopCategory(stop) !== "waypoint") return false;
          if (assigned.has(stop.id)) return false;
          if (isTripStopImmutableMidTrip(stop)) return false;
          if (addressId) {
            return (
              stop.addressId === addressId || stop.sourceAddressId === addressId
            );
          }
          return (
            (stop.locationName ?? "").trim() ===
              (input.locationName ?? "").trim() &&
            (stop.city ?? "").trim() === (input.city ?? "").trim() &&
            (input.locationName ?? "").trim().length > 0
          );
        }),
      );
    }

    if (matched) {
      out.push({ ...input, id: matched.id });
    } else {
      // Insert sin id. No incluir representación de un inmutable (origen locked, etc.).
      const existingSame = existing.find(
        (stop) => getRouteStopCategory(stop) === category,
      );
      if (
        (category === "origin" || category === "destination") &&
        existingSame &&
        isTripStopImmutableMidTrip(existingSame)
      ) {
        continue;
      }
      out.push({ ...input });
    }
  }

  return out;
}

function orderExistingStopsForRouteLine(
  stops: readonly TripStop[],
): TripStop[] {
  const origin = stops.filter((stop) => getRouteStopCategory(stop) === "origin");
  const destination = stops.filter(
    (stop) => getRouteStopCategory(stop) === "destination",
  );
  const waypoints = stops.filter(
    (stop) => getRouteStopCategory(stop) === "waypoint",
  );
  return [...origin, ...waypoints, ...destination];
}

function categoryFromCreateStop(
  input: CreateStopInput,
): "origin" | "destination" | "waypoint" {
  const types = Array.isArray(input.stopType)
    ? input.stopType
    : [input.stopType];
  if (types.includes("origin")) return "origin";
  if (types.includes("destination")) return "destination";
  return "waypoint";
}

/** Payload replan tras eliminar una escala pending. */
export function buildReplanAfterRemoveWaypoint(
  orderedStops: readonly TripStop[],
  stopId: string,
): ReplanPendingStopInput[] {
  const remaining = orderedStops.filter((stop) => stop.id !== stopId);
  return toSyncedReplanPendingStops(remaining);
}

/** Payload replan tras reorder ↑↓ de una escala pending. */
export function buildReplanAfterReorderWaypoint(
  orderedStops: readonly TripStop[],
  stopId: string,
  direction: "up" | "down",
): ReplanPendingStopInput[] | null {
  const waypoints = orderedStops.filter(
    (stop) =>
      getRouteStopCategory(stop) === "waypoint" &&
      !isTripStopImmutableMidTrip(stop),
  );
  const index = waypoints.findIndex((stop) => stop.id === stopId);
  if (index < 0) return null;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= waypoints.length) return null;

  const order = orderedStops.map((stop) => stop.id);
  const a = waypoints[index]!.id;
  const b = waypoints[swapWith]!.id;
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  if (ia < 0 || ib < 0) return null;
  const nextIds = [...order];
  nextIds[ia] = b;
  nextIds[ib] = a;
  const byId = new Map(orderedStops.map((stop) => [stop.id, stop]));
  const reordered = nextIds
    .map((id) => byId.get(id))
    .filter((stop): stop is TripStop => stop != null);

  return toSyncedReplanPendingStops(reordered);
}

