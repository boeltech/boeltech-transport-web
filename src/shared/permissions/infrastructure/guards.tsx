/**
 * Permission Guard Components
 * Clean Architecture - Infrastructure Layer
 *
 * Componentes para proteger UI según permisos.
 *
 * Ubicación: src/shared/auth/infrastructure/guards.tsx
 *
 * @example
 * // Mostrar solo si tiene permiso
 * <PermissionGuard module="trips" action="create">
 *   <CreateButton />
 * </PermissionGuard>
 *
 * // Con fallback
 * <PermissionGuard module="trips" action="delete" fallback={<DisabledButton />}>
 *   <DeleteButton />
 * </PermissionGuard>
 *
 * // Por rol
 * <RoleGuard roles={['admin', 'manager']}>
 *   <AdminPanel />
 * </RoleGuard>
 */

import { memo, type ReactNode } from "react";
import { usePermissions } from "./usePermissions";
import type {
  Module,
  Action,
  Role,
  PermissionString,
} from "../domain/entities";

// ============================================
// PERMISSION GUARD
// ============================================

interface PermissionGuardProps {
  /** Módulo requerido */
  module: Module;
  /** Acción requerida */
  action: Action;
  /** Contenido si tiene permiso */
  children: ReactNode;
  /** Contenido alternativo si no tiene permiso */
  fallback?: ReactNode;
}

export const PermissionGuard = memo(function PermissionGuard({
  module,
  action,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissions();

  // Mientras carga, no mostrar nada
  if (isLoading) {
    return null;
  }

  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
});

// ============================================
// CAN GUARD (string permission)
// ============================================

interface CanGuardProps {
  /** Permiso en formato string */
  permission: PermissionString;
  /** Contenido si tiene permiso */
  children: ReactNode;
  /** Contenido alternativo */
  fallback?: ReactNode;
}

export const CanGuard = memo(function CanGuard({
  permission,
  children,
  fallback = null,
}: CanGuardProps) {
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
});

// ============================================
// MULTI PERMISSION GUARD
// ============================================

interface MultiPermissionGuardProps {
  /** Permisos requeridos */
  permissions: PermissionString[];
  /** Modo: 'all' = todos, 'any' = al menos uno */
  mode?: "all" | "any";
  /** Contenido si cumple */
  children: ReactNode;
  /** Contenido alternativo */
  fallback?: ReactNode;
}

export const MultiPermissionGuard = memo(function MultiPermissionGuard({
  permissions,
  mode = "all",
  children,
  fallback = null,
}: MultiPermissionGuardProps) {
  const { canAll, canAny, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  const hasAccess = mode === "all" ? canAll(permissions) : canAny(permissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
});

// ============================================
// ROLE GUARD
// ============================================

interface RoleGuardProps {
  /** Roles permitidos */
  roles: Role[];
  /** Contenido si tiene el rol */
  children: ReactNode;
  /** Contenido alternativo */
  fallback?: ReactNode;
}

export const RoleGuard = memo(function RoleGuard({
  roles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { hasAnyRole, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (!hasAnyRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
});

// ============================================
// ADMIN GUARD
// ============================================

interface AdminGuardProps {
  /** Contenido solo para admin */
  children: ReactNode;
  /** Contenido alternativo */
  fallback?: ReactNode;
}

export const AdminGuard = memo(function AdminGuard({
  children,
  fallback = null,
}: AdminGuardProps) {
  const { hasRole, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (!hasRole("admin")) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
});

// ============================================
// AUTHENTICATED GUARD
// ============================================

interface AuthenticatedGuardProps {
  /** Contenido si está autenticado */
  children: ReactNode;
  /** Contenido si no está autenticado */
  fallback?: ReactNode;
}

export const AuthenticatedGuard = memo(function AuthenticatedGuard({
  children,
  fallback = null,
}: AuthenticatedGuardProps) {
  const { isAuthenticated, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
});
