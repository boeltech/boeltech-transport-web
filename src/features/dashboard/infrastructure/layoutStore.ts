/**
 * Dashboard layout persistence — localStorage now, API-ready interface.
 *
 * ## Future API contract (not implemented)
 *
 * User layout (authenticated user):
 * - `GET  /api/v1/dashboard/layout` → `DashboardLayout`
 * - `PUT  /api/v1/dashboard/layout` → body `DashboardLayout`, returns saved layout
 *
 * Role default (admin, per tenant):
 * - `GET  /api/v1/dashboard/layout/role/:role` → `DashboardLayout`
 * - `PUT  /api/v1/dashboard/layout/role/:role` → body `DashboardLayout`
 *
 * Payload shape matches {@link DashboardLayout} in `domain/layout.ts`.
 * Migrate by implementing `apiDashboardLayoutStore` with the same interface and
 * swapping the export in `useDashboardLayout`.
 */

import type { UserRole } from "@shared/constants/roles";
import {
  buildSystemDefaultLayout,
  normalizeLayout,
  type DashboardLayout,
} from "../domain/layout";

// ============================================================================
// Store interface
// ============================================================================

export interface DashboardLayoutStore {
  getUserLayout(userId: string): DashboardLayout | null;
  setUserLayout(userId: string, layout: DashboardLayout): void;
  clearUserLayout(userId: string): void;

  getRoleLayout(tenantId: string, role: UserRole): DashboardLayout | null;
  setRoleLayout(tenantId: string, role: UserRole, layout: DashboardLayout): void;
  clearRoleLayout(tenantId: string, role: UserRole): void;
}

// ============================================================================
// Storage keys
// ============================================================================

const USER_KEY_PREFIX = "boeltech-dashboard-layout:user:";
const ROLE_KEY_PREFIX = "boeltech-dashboard-layout:role:";

function userStorageKey(userId: string): string {
  return `${USER_KEY_PREFIX}${userId}`;
}

function roleStorageKey(tenantId: string, role: UserRole): string {
  return `${ROLE_KEY_PREFIX}${tenantId}:${role}`;
}

// ============================================================================
// Parse / serialize
// ============================================================================

function parseLayout(raw: string | null): DashboardLayout | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DashboardLayout;
    if (!parsed || !Array.isArray(parsed.widgets)) return null;
    return normalizeLayout(parsed);
  } catch {
    return null;
  }
}

function serializeLayout(layout: DashboardLayout): string {
  return JSON.stringify(normalizeLayout(layout));
}

function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable
  }
}

function safeRemoveItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage unavailable
  }
}

// ============================================================================
// localStorage implementation
// ============================================================================

export const localDashboardLayoutStore: DashboardLayoutStore = {
  getUserLayout(userId) {
    return parseLayout(safeGetItem(userStorageKey(userId)));
  },

  setUserLayout(userId, layout) {
    safeSetItem(userStorageKey(userId), serializeLayout(layout));
  },

  clearUserLayout(userId) {
    safeRemoveItem(userStorageKey(userId));
  },

  getRoleLayout(tenantId, role) {
    return parseLayout(safeGetItem(roleStorageKey(tenantId, role)));
  },

  setRoleLayout(tenantId, role, layout) {
    safeSetItem(roleStorageKey(tenantId, role), serializeLayout(layout));
  },

  clearRoleLayout(tenantId, role) {
    safeRemoveItem(roleStorageKey(tenantId, role));
  },
};

/** Active store binding — replace with `apiDashboardLayoutStore` when backend exists. */
export const dashboardLayoutStore: DashboardLayoutStore =
  localDashboardLayoutStore;

export { buildSystemDefaultLayout };
