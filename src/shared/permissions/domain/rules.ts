/**
 * Permission Domain - Business Rules
 * Clean Architecture - Domain Layer
 *
 * Reglas de negocio puras para el sistema RBAC.
 * Funciones sin efectos secundarios, fácilmente testeables.
 *
 * Ubicación: src/shared/auth/domain/rules.ts
 */

import { ROLES, type UserRole } from "@shared/constants/roles";
import {
  type Module,
  type Action,
  type Permission,
  type PermissionString,
  type PermissionCheckResult,
  type RoleDefinition,
  MODULES,
  ACTIONS,
} from "./entities";

// ============================================================================
// PERMISSION STRING HELPERS
// ============================================================================

/**
 * Crea un string de permiso desde módulo y acción
 */
export function createPermissionString(
  module: Module,
  action: Action,
): PermissionString {
  return `${module}.${action}` as PermissionString;
}

/**
 * Parsea un string de permiso a objeto
 */
export function parsePermissionString(
  permission: PermissionString,
): Permission {
  const [module, action] = permission.split(".") as [Module, Action];
  return { module, action };
}

/**
 * Valida si un string es un permiso válido
 */
export function isValidPermission(
  permission: string,
): permission is PermissionString {
  const parts = permission.split(".");
  if (parts.length !== 2) return false;

  const [module, action] = parts;
  return (
    MODULES.includes(module as Module) && ACTIONS.includes(action as Action)
  );
}

// ============================================================================
// PERMISSION CHECK RULES
// ============================================================================

/**
 * Verifica si un rol es admin
 */
export function isAdminRole(role: UserRole | null): boolean {
  return role === ROLES.ADMIN;
}

/**
 * Verifica si un permiso está en una lista
 */
export function hasPermissionInList(
  permission: PermissionString,
  permissions: PermissionString[],
): boolean {
  return permissions.includes(permission);
}

/**
 * Verifica permiso con resultado detallado
 */
export function checkPermission(
  role: UserRole | null,
  permissions: PermissionString[],
  module: Module,
  action: Action,
  deniedPermissions: PermissionString[] = [],
): PermissionCheckResult {
  // Sin rol = sin permisos
  if (!role) {
    return { allowed: false, reason: "no_role" };
  }

  // Admin tiene todos los permisos
  if (isAdminRole(role)) {
    return { allowed: true, reason: "granted", source: "admin" };
  }

  const permissionString = createPermissionString(module, action);

  // Verificar si está explícitamente denegado
  if (hasPermissionInList(permissionString, deniedPermissions)) {
    return { allowed: false, reason: "denied" };
  }

  // Verificar si tiene el permiso
  if (hasPermissionInList(permissionString, permissions)) {
    return { allowed: true, reason: "granted", source: "role" };
  }

  return { allowed: false, reason: "not_found" };
}

/**
 * Verifica múltiples permisos (AND - todos requeridos)
 */
export function checkAllPermissions(
  role: UserRole | null,
  permissions: PermissionString[],
  required: PermissionString[],
): boolean {
  if (isAdminRole(role)) return true;
  return required.every((p) => hasPermissionInList(p, permissions));
}

/**
 * Verifica múltiples permisos (OR - al menos uno)
 */
export function checkAnyPermission(
  role: UserRole | null,
  permissions: PermissionString[],
  required: PermissionString[],
): boolean {
  if (isAdminRole(role)) return true;
  return required.some((p) => hasPermissionInList(p, permissions));
}

// ============================================================================
// ROLE RULES
// ============================================================================

/**
 * Verifica si tiene un rol específico
 */
export function hasRole(
  userRole: UserRole | null,
  targetRole: UserRole,
): boolean {
  return userRole === targetRole;
}

/**
 * Verifica si tiene alguno de los roles
 */
export function hasAnyRole(
  userRole: UserRole | null,
  roles: UserRole[],
): boolean {
  if (!userRole) return false;
  return roles.includes(userRole);
}

/**
 * Obtiene la jerarquía de roles (para herencia de permisos si se implementa)
 *
 * NOTA: Actualmente no se usa herencia de roles, pero se deja la estructura
 * preparada por si en el futuro se requiere.
 */
export function getRoleHierarchy(role: UserRole): UserRole[] {
  const hierarchy: Record<UserRole, UserRole[]> = {
    admin: [], // Admin no hereda de nadie
    manager: [], // Manager no hereda (tiene permisos propios)
    dispatcher: [],
    accountant: [], // Accountant no hereda
    operator: [], // Operator no hereda
    driver: [],
    client: [], // Client no hereda
  };

  return hierarchy[role] || [];
}

/**
 * Verifica si un rol tiene jerarquía sobre otro
 * Útil para features como "ver subordinados" o "aprobar requests"
 */
export function isRoleAbove(userRole: UserRole, targetRole: UserRole): boolean {
  if (userRole === ROLES.ADMIN) return true;

  // Jerarquía simple: manager > accountant/operator > client
  const levels: Record<UserRole, number> = {
    admin: 6,
    manager: 5,
    dispatcher: 4,
    accountant: 3,
    operator: 3,
    driver: 2,
    client: 1,
  };

  return levels[userRole] > levels[targetRole];
}

// ============================================================================
// MODULE ACCESS RULES
// ============================================================================

/**
 * Obtiene las acciones disponibles para un módulo según el rol
 */
export function getAvailableActions(
  role: UserRole | null,
  module: Module,
  permissions: PermissionString[],
): Action[] {
  if (!role) return [];
  if (isAdminRole(role)) return [...ACTIONS];

  return ACTIONS.filter((action) => {
    const permission = createPermissionString(module, action);
    return hasPermissionInList(permission, permissions);
  });
}

/**
 * Obtiene los módulos accesibles para un usuario
 */
export function getAccessibleModules(
  role: UserRole | null,
  permissions: PermissionString[],
): Module[] {
  if (!role) return [];
  if (isAdminRole(role)) return [...MODULES];

  const accessibleModules = new Set<Module>();

  permissions.forEach((permission) => {
    const { module } = parsePermissionString(permission);
    accessibleModules.add(module);
  });

  return Array.from(accessibleModules);
}

/**
 * Verifica si un módulo es accesible
 */
export function isModuleAccessible(
  role: UserRole | null,
  module: Module,
  permissions: PermissionString[],
): boolean {
  if (!role) return false;
  if (isAdminRole(role)) return true;

  return permissions.some((p) => p.startsWith(`${module}.`));
}

// ============================================================================
// PERMISSION MERGE RULES
// ============================================================================

/**
 * Combina permisos de rol con permisos personalizados
 */
export function mergePermissions(
  rolePermissions: PermissionString[],
  customPermissions: PermissionString[] = [],
  deniedPermissions: PermissionString[] = [],
): PermissionString[] {
  // Combinar permisos de rol y custom
  const combined = new Set([...rolePermissions, ...customPermissions]);

  // Remover los denegados
  deniedPermissions.forEach((p) => combined.delete(p));

  return Array.from(combined);
}

/**
 * Resuelve permisos de un rol incluyendo herencia
 *
 * NOTA: Actualmente la herencia no está implementada en rolePermissions,
 * pero esta función está preparada para cuando se necesite.
 */
export function resolveRolePermissions(
  role: UserRole,
  roleDefinitions: Map<UserRole, RoleDefinition>,
): PermissionString[] {
  const definition = roleDefinitions.get(role);
  if (!definition) return [];

  const permissions = new Set(definition.permissions);

  // Agregar permisos heredados (si existen)
  if (definition.inheritsFrom) {
    definition.inheritsFrom.forEach((inheritedRole) => {
      const inheritedDef = roleDefinitions.get(inheritedRole);
      if (inheritedDef) {
        inheritedDef.permissions.forEach((p) => permissions.add(p));
      }
    });
  }

  return Array.from(permissions);
}
