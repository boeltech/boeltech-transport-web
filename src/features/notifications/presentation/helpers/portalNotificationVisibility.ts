import type { NotificationType, UserNotification } from "../../domain";

/**
 * Alertas de dashboard pensadas para staff (flota / vencimientos / retrasos tenant).
 * Portales client/driver no deben verlas en campana ni inbox.
 */
export const STAFF_OPS_NOTIFICATION_TYPES = [
  "overdue_trip",
  "license_expiring",
  "medical_certificate_expiring",
  "insurance_expiring",
  "sct_permit_expiring",
] as const satisfies readonly NotificationType[];

const STAFF_OPS_TYPE_SET = new Set<string>(STAFF_OPS_NOTIFICATION_TYPES);

export function isStaffOpsNotificationType(type: NotificationType): boolean {
  return STAFF_OPS_TYPE_SET.has(type);
}

/** Filtra filas staff-ops cuando el actor es portal (client | driver). */
export function filterNotificationsForPortal(
  items: readonly UserNotification[],
  isPortal: boolean,
): UserNotification[] {
  if (!isPortal) return [...items];
  return items.filter((item) => !isStaffOpsNotificationType(item.type));
}
