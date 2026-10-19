import type { GpsMovementStatusType } from "../../domain";

/**
 * Etiqueta de movimiento (PRD D36) — coexiste con semáforo online/stale/offline.
 */
export function movementLabel(
  status: GpsMovementStatusType | null | undefined,
  labels: { moving: string; stopped: string; empty: string },
): string {
  if (status === "moving") return labels.moving;
  if (status === "stopped") return labels.stopped;
  return labels.empty;
}
