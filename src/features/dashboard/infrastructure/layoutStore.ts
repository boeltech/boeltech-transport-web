/**
 * Dashboard layout persistence — localStorage v2, API-ready interface.
 *
 * Claves v2: `boeltech-dashboard-layout:v2:user:` / `:role:`.
 * Al leer: v2 → si falta, migra v1 (Q12) y escribe v2.
 */

import type { UserRole } from "@shared/constants/roles";
import {
  migrateLayoutV1toV2,
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

const USER_KEY_PREFIX_V2 = "boeltech-dashboard-layout:v2:user:";
const ROLE_KEY_PREFIX_V2 = "boeltech-dashboard-layout:v2:role:";
const USER_KEY_PREFIX_V1 = "boeltech-dashboard-layout:user:";
const ROLE_KEY_PREFIX_V1 = "boeltech-dashboard-layout:role:";

function userStorageKeyV2(userId: string): string {
  return `${USER_KEY_PREFIX_V2}${userId}`;
}

function roleStorageKeyV2(tenantId: string, role: UserRole): string {
  return `${ROLE_KEY_PREFIX_V2}${tenantId}:${role}`;
}

function userStorageKeyV1(userId: string): string {
  return `${USER_KEY_PREFIX_V1}${userId}`;
}

function roleStorageKeyV1(tenantId: string, role: UserRole): string {
  return `${ROLE_KEY_PREFIX_V1}${tenantId}:${role}`;
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

function readMigrating(
  v2Key: string,
  v1Key: string,
): DashboardLayout | null {
  const v2 = parseLayout(safeGetItem(v2Key));
  if (v2) return v2;

  const v1 = parseLayout(safeGetItem(v1Key));
  if (!v1) return null;

  const migrated = migrateLayoutV1toV2(v1);
  safeSetItem(v2Key, serializeLayout(migrated));
  return migrated;
}

// ============================================================================
// localStorage implementation
// ============================================================================

export const localDashboardLayoutStore: DashboardLayoutStore = {
  getUserLayout(userId) {
    return readMigrating(userStorageKeyV2(userId), userStorageKeyV1(userId));
  },

  setUserLayout(userId, layout) {
    safeSetItem(userStorageKeyV2(userId), serializeLayout(layout));
  },

  clearUserLayout(userId) {
    safeRemoveItem(userStorageKeyV2(userId));
    safeRemoveItem(userStorageKeyV1(userId));
  },

  getRoleLayout(tenantId, role) {
    return readMigrating(
      roleStorageKeyV2(tenantId, role),
      roleStorageKeyV1(tenantId, role),
    );
  },

  setRoleLayout(tenantId, role, layout) {
    safeSetItem(roleStorageKeyV2(tenantId, role), serializeLayout(layout));
  },

  clearRoleLayout(tenantId, role) {
    safeRemoveItem(roleStorageKeyV2(tenantId, role));
    safeRemoveItem(roleStorageKeyV1(tenantId, role));
  },
};

/** Active store binding — replace with `apiDashboardLayoutStore` when backend exists. */
export const dashboardLayoutStore: DashboardLayoutStore =
  localDashboardLayoutStore;

export { buildRoleDefaultLayout, buildSystemDefaultLayout } from "../domain/layout";
