/**
 * Permission Domain - Business Rules
 * Clean Architecture - Domain Layer
 *
 * Reglas de negocio puras para el sistema RBAC.
 * Funciones sin efectos secundarios, fácilmente testeables.
 *
 * Ubicación: src/shared/auth/domain/rules.ts
 */

import {
  type Role,
  type Module,
  type Action,
  type Permission,
  type PermissionString,
  type PermissionCheckResult,
  type RoleDefinition,
  MODULES,
  ACTIONS,
} from "./entities";

// ============================================
// PERMISSION STRING HELPERS
// ============================================

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

// ============================================
// PERMISSION CHECK RULES
// ============================================

/**
 * Verifica si un rol es admin
 */
export function isAdminRole(role: Role | null): boolean {
  return role === "admin";
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
  role: Role | null,
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
  role: Role | null,
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
  role: Role | null,
  permissions: PermissionString[],
  required: PermissionString[],
): boolean {
  if (isAdminRole(role)) return true;
  return required.some((p) => hasPermissionInList(p, permissions));
}

// ============================================
// ROLE RULES
// ============================================

/**
 * Verifica si tiene un rol específico
 */
export function hasRole(userRole: Role | null, targetRole: Role): boolean {
  return userRole === targetRole;
}

/**
 * Verifica si tiene alguno de los roles
 */
export function hasAnyRole(userRole: Role | null, roles: Role[]): boolean {
  if (!userRole) return false;
  return roles.includes(userRole);
}

/**
 * Obtiene la jerarquía de roles (para herencia)
 */
export function getRoleHierarchy(role: Role): Role[] {
  const hierarchy: Record<Role, Role[]> = {
    admin: [],
    manager: ["fleet_coordinator", "trip_coordinator", "accountant"],
    fleet_coordinator: ["operator"],
    trip_coordinator: ["operator"],
    hr: [],
    accountant: [],
    operator: [],
    driver: [],
    client: [],
  };

  return hierarchy[role] || [];
}

/**
 * Verifica si un rol tiene jerarquía sobre otro
 */
export function isRoleAbove(userRole: Role, targetRole: Role): boolean {
  if (userRole === "admin") return true;
  const subordinates = getRoleHierarchy(userRole);
  return subordinates.includes(targetRole);
}

// ============================================
// MODULE ACCESS RULES
// ============================================

/**
 * Obtiene las acciones disponibles para un módulo según el rol
 */
export function getAvailableActions(
  role: Role | null,
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
  role: Role | null,
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

// ============================================
// PERMISSION MERGE RULES
// ============================================

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
 */
export function resolveRolePermissions(
  role: Role,
  roleDefinitions: Map<Role, RoleDefinition>,
): PermissionString[] {
  const definition = roleDefinitions.get(role);
  if (!definition) return [];

  const permissions = new Set(definition.permissions);

  // Agregar permisos heredados
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
