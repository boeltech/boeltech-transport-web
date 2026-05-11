/**
 * Roles que pueden llamar a GET /api/v1/finance/summary y /finance/account-statement.
 * Debe coincidir con `authorize([...])` en `invoicing.routes.ts` (financeRouter) del API.
 */
import { ROLES, type UserRole } from "@shared/constants/roles";

export const FINANCE_SUMMARY_ROUTE_ROLES: readonly UserRole[] = [
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.ACCOUNTANT,
];

export function canAccessFinanceSummaryRoute(
  role: UserRole | null | undefined,
): boolean {
  return role != null && FINANCE_SUMMARY_ROUTE_ROLES.includes(role);
}
