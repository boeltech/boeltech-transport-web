import { isApiError } from "@shared/api/interceptors/error-handler";

export const FLEET_AVAILABILITY_CONFLICT_CODE = "FLEET_AVAILABILITY_CONFLICT";

export type FleetConflictResourceType =
  | "vehicle"
  | "driver"
  | "trailer"
  | "internal_staff";

export type FleetConflictKind =
  | "fleet_overlap"
  | "staff_on_peer_staff"
  | "staff_on_peer_primary";

export type FleetConflictRole = "helper" | "secondary_driver";

export type FleetAvailabilityConflict = {
  resourceType: FleetConflictResourceType;
  resourceId: string;
  displayLabel: string;
  role?: FleetConflictRole;
  conflictingTripId?: string;
  conflictingTripCode: string;
  conflictKind: FleetConflictKind;
};

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readResourceType(value: unknown): FleetConflictResourceType | null {
  if (
    value === "vehicle" ||
    value === "driver" ||
    value === "trailer" ||
    value === "internal_staff"
  ) {
    return value;
  }
  return null;
}

function readConflictKind(value: unknown): FleetConflictKind | null {
  if (
    value === "fleet_overlap" ||
    value === "staff_on_peer_staff" ||
    value === "staff_on_peer_primary"
  ) {
    return value;
  }
  return null;
}

function readRole(value: unknown): FleetConflictRole | undefined {
  if (value === "helper" || value === "secondary_driver") return value;
  return undefined;
}

function parseConflict(raw: unknown): FleetAvailabilityConflict | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const resourceType = readResourceType(
    record.resource_type ?? record.resourceType,
  );
  const resourceId =
    readString(record.resource_id) ?? readString(record.resourceId);
  const displayLabel =
    readString(record.display_label) ?? readString(record.displayLabel);
  const conflictingTripCode =
    readString(record.conflicting_trip_code) ??
    readString(record.conflictingTripCode);
  const conflictKind = readConflictKind(
    record.conflict_kind ?? record.conflictKind,
  );
  if (
    !resourceType ||
    !resourceId ||
    !displayLabel ||
    !conflictingTripCode ||
    !conflictKind
  ) {
    return null;
  }
  const conflictingTripId =
    readString(record.conflicting_trip_id) ??
    readString(record.conflictingTripId) ??
    undefined;
  const role = readRole(record.role);
  return {
    resourceType,
    resourceId,
    displayLabel,
    ...(role ? { role } : {}),
    ...(conflictingTripId ? { conflictingTripId } : {}),
    conflictingTripCode,
    conflictKind,
  };
}

function parseConflictsArray(value: unknown): FleetAvailabilityConflict[] {
  if (!Array.isArray(value)) return [];
  const out: FleetAvailabilityConflict[] = [];
  for (const entry of value) {
    const conflict = parseConflict(entry);
    if (conflict) out.push(conflict);
  }
  return out;
}

function readErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) return error.code;
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }
  return undefined;
}

function readErrorDetails(error: unknown): Record<string, unknown> | undefined {
  if (isApiError(error)) return error.details;
  if (
    error &&
    typeof error === "object" &&
    "details" in error &&
    (error as { details?: unknown }).details &&
    typeof (error as { details?: unknown }).details === "object" &&
    !Array.isArray((error as { details?: unknown }).details)
  ) {
    return (error as { details: Record<string, unknown> }).details;
  }
  return undefined;
}

/**
 * Parsea `FLEET_AVAILABILITY_CONFLICT` (collect-all) desde ApiError u error
 * duck-typed con `code` + `details.conflicts[]` (TripActionError / TripCreationError).
 */
export function parseFleetAvailabilityConflicts(
  error: unknown,
): FleetAvailabilityConflict[] | null {
  if (readErrorCode(error) !== FLEET_AVAILABILITY_CONFLICT_CODE) {
    return null;
  }
  const details = readErrorDetails(error);
  if (!details) return [];
  return parseConflictsArray(details.conflicts);
}

export function isFleetAvailabilityConflictError(error: unknown): boolean {
  return parseFleetAvailabilityConflicts(error) !== null;
}
