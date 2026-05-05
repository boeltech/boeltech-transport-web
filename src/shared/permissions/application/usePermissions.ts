/**
 * usePermissions Hook
 * Clean Architecture - Infrastructure Layer
 *
 * Hook principal para verificar permisos RBAC.
 *
 * Ubicación: src/shared/auth/infrastructure/usePermissions.ts
 *
 * @example
 * const { hasPermission, hasRole, can } = usePermissions();
 *
 * // Verificar permiso (módulo + acción)
 * if (hasPermission('trips', 'create')) { ... }
 *
 * // Verificar con string
 * if (can('trips.create')) { ... }
 *
 * // Verificar rol
 * if (hasRole('admin')) { ... }
 */

import { useContext } from "react";
import {
  PermissionContext,
  type PermissionContextValue,
} from "../infrastructure/PermissionContext";
import type { Module, Action, PermissionString } from "../domain/entities";
import { ROLES, type UserRole } from "@shared/constants/roles";

// ============================================
// Return Type
// ============================================

export type UsePermissionsReturn = PermissionContextValue;

// ============================================
// Development Fallback
// ============================================

function createDevFallback(): PermissionContextValue {
  return {
    role: ROLES.ADMIN,
    permissions: [],
    isLoading: false,
    isAuthenticated: true,
    hasPermission: () => true,
    can: () => true,
    canAll: () => true,
    canAny: () => true,
    hasRole: () => true,
    hasAnyRole: () => true,
    getModuleActions: () => [
      "read",
      "create",
      "update",
      "delete",
      "updateStatus",
      "approve",
      "export",
    ],
    getAccessibleModules: () => [
      "dashboard",
      "trips",
      "vehicles",
      "drivers",
      "clients",
      "branches",
      "maintenance",
      "fuel",
      "invoices",
      "reports",
      "users",
      "settings",
    ],
  };
}

// ============================================
// Hook
// ============================================

export function usePermissions(): UsePermissionsReturn {
  const context = useContext(PermissionContext);

  // En desarrollo, permitir todo si no hay provider
  if (!context) {
    if (import.meta.env.DEV) {
      console.warn(
        "[usePermissions] No PermissionProvider found. " +
          "Using development fallback with full permissions.",
      );
      return createDevFallback();
    }

    throw new Error(
      "usePermissions debe usarse dentro de un PermissionProvider. " +
        "Asegúrate de envolver tu aplicación con <PermissionProvider>.",
    );
  }

  return context;
}

// ============================================
// Convenience Hooks
// ============================================

/**
 * Hook para verificar un permiso específico
 */
export function useHasPermission(module: Module, action: Action): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(module, action);
}

/**
 * Hook para verificar si tiene un rol
 */
export function useHasRole(role: UserRole): boolean {
  const { hasRole } = usePermissions();
  return hasRole(role);
}

/**
 * Hook para verificar múltiples permisos
 */
export function useCanAll(permissions: PermissionString[]): boolean {
  const { canAll } = usePermissions();
  return canAll(permissions);
}

/**
 * Hook para verificar si tiene algún permiso
 */
export function useCanAny(permissions: PermissionString[]): boolean {
  const { canAny } = usePermissions();
  return canAny(permissions);
}

/**
 * Hook para obtener el rol actual
 */
export function useRole(): UserRole | null {
  const { role } = usePermissions();
  return role;
}

/**
 * Hook para verificar si está autenticado
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = usePermissions();
  return isAuthenticated;
}
