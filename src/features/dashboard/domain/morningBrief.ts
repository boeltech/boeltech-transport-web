/**
 * Banda matutina Aurora — chrome fijo fuera del widget registry (F1).
 * Solo admin + manager (manager exige finance + lectura de viajes).
 */

import { ROLES, type UserRole } from "@shared/constants/roles";
import type { ApprovableType } from "@features/approvals/domain";

export function shouldShowMorningBrief(input: {
  role: UserRole | null | undefined;
  canReadTrips: boolean;
  showFinance: boolean;
}): boolean {
  if (!input.canReadTrips || !input.role) return false;
  if (input.role === ROLES.ADMIN) return true;
  if (input.role === ROLES.MANAGER) return input.showFinance;
  return false;
}

/** Ancla in-page del panel de alertas (focus/scroll desde el brief). */
export const DASHBOARD_ALERTS_WIDGET_DOM_ID = "dashboard-widget-alerts";

/** Tipos de la bandeja «Me toca» que el brief sabe priorizar, en orden de destino. */
export const PENDING_APPROVALS_BRIEF_TYPES = [
  "trip_expense",
  "driver_advance_request",
  "internal_staff_compensation",
] as const satisfies readonly ApprovableType[];

export type PendingApprovalsBriefType =
  (typeof PENDING_APPROVALS_BRIEF_TYPES)[number];

export type PendingApprovalsBriefCounts = Partial<
  Record<PendingApprovalsBriefType, number>
>;

/**
 * Tipo destino del click en «Por autorizar»: el primero con count > 0 en el orden
 * trip_expense → driver_advance_request → internal_staff_compensation.
 * Sin datos o todos en 0 → trip_expense (default de la bandeja).
 */
export function resolvePendingApprovalsDestinationType(
  counts: PendingApprovalsBriefCounts | null | undefined,
): PendingApprovalsBriefType {
  if (!counts) return PENDING_APPROVALS_BRIEF_TYPES[0];
  for (const type of PENDING_APPROVALS_BRIEF_TYPES) {
    if ((counts[type] ?? 0) > 0) return type;
  }
  return PENDING_APPROVALS_BRIEF_TYPES[0];
}

/**
 * URL destino de «Por autorizar». `inboxPath` viene de la feature approvals
 * (`APPROVALS_INBOX_PATH`) — el dominio no importa su presentación.
 */
export function buildPendingApprovalsHref(
  inboxPath: string,
  counts: PendingApprovalsBriefCounts | null | undefined,
): string {
  const type = resolvePendingApprovalsDestinationType(counts);
  return `${inboxPath}?type=${encodeURIComponent(type)}`;
}
