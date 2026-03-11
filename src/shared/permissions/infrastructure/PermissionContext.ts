/**
 * Permission Context
 * Clean Architecture - Infrastructure Layer
 *
 * Contexto de React para el sistema de permisos.
 *
 * Ubicación: src/shared/auth/infrastructure/PermissionContext.ts
 */

import { createContext } from "react";
import type { PermissionString, Module, Action } from "../domain/entities";
import type { UserRole } from "@shared/constants/roles";

// ============================================
// Context Value Type
// ============================================

export interface PermissionContextValue {
  // State
  role: UserRole | null;
  permissions: PermissionString[];
  isLoading: boolean;
  isAuthenticated: boolean;

  // Permission checks
  hasPermission: (module: Module, action: Action) => boolean;
  can: (permission: PermissionString) => boolean;
  canAll: (permissions: PermissionString[]) => boolean;
  canAny: (permissions: PermissionString[]) => boolean;

  // Role checks
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;

  // Module helpers
  getModuleActions: (module: Module) => Action[];
  getAccessibleModules: () => Module[];
}

// ============================================
// Context
// ============================================

export const PermissionContext = createContext<
  PermissionContextValue | undefined
>(undefined);

PermissionContext.displayName = "PermissionContext";
