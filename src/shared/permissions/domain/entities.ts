/**
 * Permission Domain - Entities & Types
 * Clean Architecture - Domain Layer
 *
 * Define las entidades y tipos del sistema RBAC.
 * Esta capa NO tiene dependencias externas.
 *
 * Ubicación: src/shared/auth/domain/entities.ts
 */

// ============================================
// MODULES - Módulos del sistema ERP
// ============================================

export const MODULES = [
  "dashboard",
  "trips",
  "vehicles",
  "drivers",
  "clients",
  "maintenance",
  "fuel",
  "invoices",
  "reports",
  "users",
  "settings",
] as const;

export type Module = (typeof MODULES)[number];

// ============================================
// ACTIONS - Acciones disponibles
// ============================================

export const ACTIONS = [
  "read",
  "create",
  "update",
  "delete",
  "updateStatus",
  "approve",
  "reject",
  "export",
  "import",
  "assign",
] as const;

export type Action = (typeof ACTIONS)[number];

// ============================================
// ROLES - Roles del sistema
// ============================================

export const ROLES = [
  "admin",
  "manager",
  "fleet_coordinator",
  "trip_coordinator",
  "hr",
  "accountant",
  "operator",
  "driver",
  "client",
] as const;

export type Role = (typeof ROLES)[number];

// ============================================
// PERMISSION - Permiso individual
// ============================================

/**
 * Permiso en formato string: "module.action"
 * @example "trips.create", "vehicles.delete"
 */
export type PermissionString = `${Module}.${Action}`;

/**
 * Permiso como objeto
 */
export interface Permission {
  readonly module: Module;
  readonly action: Action;
}

// ============================================
// USER PERMISSIONS - Permisos de un usuario
// ============================================

/**
 * Información de permisos de un usuario
 */
export interface UserPermissions {
  readonly userId: string;
  readonly role: Role;
  readonly permissions: PermissionString[];
  readonly customPermissions?: PermissionString[];
  readonly deniedPermissions?: PermissionString[];
}

// ============================================
// ROLE DEFINITION - Definición de un rol
// ============================================

/**
 * Definición completa de un rol
 */
export interface RoleDefinition {
  readonly role: Role;
  readonly name: string;
  readonly description: string;
  readonly permissions: PermissionString[];
  readonly inheritsFrom?: Role[];
}

// ============================================
// PERMISSION CHECK RESULT
// ============================================

/**
 * Resultado de verificación de permiso
 */
export interface PermissionCheckResult {
  readonly allowed: boolean;
  readonly reason?: "granted" | "denied" | "no_role" | "not_found";
  readonly source?: "role" | "custom" | "admin";
}

// ============================================
// PERMISSION CONTEXT STATE
// ============================================

/**
 * Estado del contexto de permisos
 */
export interface PermissionState {
  readonly role: Role | null;
  readonly permissions: PermissionString[];
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
}
