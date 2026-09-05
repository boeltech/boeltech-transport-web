/**
 * Configuración del workbench de viajes — ADR-0090.
 *
 * Constantes de buckets, mapeo a TripStatus y helpers de rol.
 */

import { TripStatus, type TripStatusType } from "../../domain";

// ============================================================================
// BUCKET TYPES
// ============================================================================

/**
 * Buckets navegables en el awareness strip.
 * Cada uno corresponde 1:1 a un TripStatus.
 */
export type TripWorkbenchBucket =
  | "draft"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

/** Orden de los buckets en el strip (pipeline). */
export const TRIP_WORKBENCH_BUCKETS: TripWorkbenchBucket[] = [
  "draft",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
];

/** Mapeo bucket → TripStatus para filtrar la lista. */
export const BUCKET_TO_STATUS: Record<TripWorkbenchBucket, TripStatusType> = {
  draft: TripStatus.DRAFT,
  scheduled: TripStatus.SCHEDULED,
  in_progress: TripStatus.IN_PROGRESS,
  completed: TripStatus.COMPLETED,
  cancelled: TripStatus.CANCELLED,
};

// ============================================================================
// ROLE GATING (D4)
// ============================================================================

/** Buckets visibles para el portal de cliente. */
const CLIENT_PORTAL_BUCKETS: TripWorkbenchBucket[] = [
  "scheduled",
  "in_progress",
  "completed",
];

/** Buckets visibles para el portal de conductor. */
const DRIVER_PORTAL_BUCKETS: TripWorkbenchBucket[] = [
  "scheduled",
  "in_progress",
  "completed",
];

export function getTripWorkbenchBucketsForRole(
  isClientPortal: boolean,
  isDriverPortal: boolean,
): TripWorkbenchBucket[] {
  if (isClientPortal) return CLIENT_PORTAL_BUCKETS;
  if (isDriverPortal) return DRIVER_PORTAL_BUCKETS;
  return TRIP_WORKBENCH_BUCKETS;
}

// ============================================================================
// HELPERS
// ============================================================================

export function isTripWorkbenchBucket(
  value: string,
): value is TripWorkbenchBucket {
  return (TRIP_WORKBENCH_BUCKETS as string[]).includes(value);
}
