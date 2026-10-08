import { isApiError } from "@shared/api/interceptors/error-handler";

export interface ActiveTripRef {
  id: string;
  tripCode: string;
}

export type DeactivateErrorView =
  | { kind: "active_trips"; trips: ActiveTripRef[]; total: number; message: string }
  | { kind: "generic"; message: string };

export type RestoreErrorView =
  | {
      kind: "conflict";
      field: "unit_number" | "license_plate";
      value: string;
      conflictingVehicleId: string | null;
      message: string;
    }
  | { kind: "not_operable"; message: string }
  | { kind: "generic"; message: string };

const FALLBACK_MESSAGE = "Ocurrió un error inesperado.";

function messageOf(error: unknown): string {
  return error instanceof Error && error.message ? error.message : FALLBACK_MESSAGE;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function parseActiveTrips(raw: unknown): ActiveTripRef[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const id = asString(record.id);
    const tripCode = asString(record.trip_code) ?? asString(record.tripCode);
    return id && tripCode ? [{ id, tripCode }] : [];
  });
}

/** 409 `VEHICLE_ASSIGNED_TO_ACTIVE_TRIP` → lista de viajes enlazables (PRD D3). */
export function toDeactivateErrorView(error: unknown): DeactivateErrorView {
  const message = messageOf(error);
  if (isApiError(error) && error.code === "VEHICLE_ASSIGNED_TO_ACTIVE_TRIP") {
    const trips = parseActiveTrips(error.details?.active_trips);
    const count = error.details?.active_trip_count;
    const total =
      typeof count === "number" && count >= trips.length ? count : trips.length;
    return { kind: "active_trips", trips, total, message };
  }
  return { kind: "generic", message };
}

/** Choque de unicidad (número económico / placa) o unidad no operable (422). */
export function toRestoreErrorView(error: unknown): RestoreErrorView {
  const message = messageOf(error);
  if (!isApiError(error)) return { kind: "generic", message };

  if (error.code === "UNIT_NUMBER_EXISTS" || error.code === "LICENSE_PLATE_EXISTS") {
    const field = error.code === "UNIT_NUMBER_EXISTS" ? "unit_number" : "license_plate";
    const value = asString(error.details?.[field]);
    if (value) {
      return {
        kind: "conflict",
        field,
        value,
        conflictingVehicleId: asString(error.details?.conflicting_vehicle_id),
        message,
      };
    }
    return { kind: "generic", message };
  }

  if (error.status === 422) {
    return { kind: "not_operable", message: message.replace(/[.\s]+$/, "") };
  }

  return { kind: "generic", message };
}
