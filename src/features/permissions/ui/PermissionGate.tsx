// src/features/permissions/ui/PermissionGate.tsx

import type { ReactNode } from "react";
import { usePermissions } from "@app/providers/PermissionProvider";
import type {
  Permission,
  Module,
  UserRole,
} from "@features/permissions/model/types";

// ============================================
// PermissionGate - Renderizado condicional por permiso
// ============================================
interface PermissionGateProps {
  /** Permiso requerido */
  permission?: Permission;

  /** Múltiples permisos (requiere TODOS) */
  permissions?: Permission[];

  /** Múltiples permisos (requiere AL MENOS UNO) */
  anyPermission?: Permission[];

  /** Módulo requerido */
  module?: Module;

  /** Roles permitidos */
  roles?: UserRole[];

  /** Contenido a mostrar si tiene permiso */
  children: ReactNode;

  /** Contenido alternativo si no tiene permiso */
  fallback?: ReactNode;
}

export const PermissionGate = ({
  permission,
  permissions,
  anyPermission,
  module,
  roles,
  children,
  fallback = null,
}: PermissionGateProps) => {
  const {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasModuleAccess,
    hasRole,
  } = usePermissions();

  // Evaluar todas las condiciones
  const checks: boolean[] = [];

  if (permission) {
    checks.push(hasPermission(permission));
  }

  if (permissions && permissions.length > 0) {
    checks.push(hasAllPermissions(permissions));
  }

  if (anyPermission && anyPermission.length > 0) {
    checks.push(hasAnyPermission(anyPermission));
  }

  if (module) {
    checks.push(hasModuleAccess(module));
  }

  if (roles && roles.length > 0) {
    checks.push(hasRole(roles));
  }

  // Si no hay checks, permitir por defecto
  if (checks.length === 0) {
    return <>{children}</>;
  }

  // Todas las condiciones deben cumplirse
  const isAllowed = checks.every((check) => check);

  return isAllowed ? <>{children}</> : <>{fallback}</>;
};

// ============================================
// Can - Alias más semántico para PermissionGate
// ============================================
interface CanProps {
  /** Acción que se quiere realizar */
  do: Permission | Permission[];

  /** Si requiere todos los permisos o solo uno */
  mode?: "all" | "any";

  children: ReactNode;
  fallback?: ReactNode;
}

export const Can = ({
  do: permissions,
  mode = "all",
  children,
  fallback,
}: CanProps) => {
  const permArray = Array.isArray(permissions) ? permissions : [permissions];

  if (mode === "any") {
    return (
      <PermissionGate anyPermission={permArray} fallback={fallback}>
        {children}
      </PermissionGate>
    );
  }

  return (
    <PermissionGate permissions={permArray} fallback={fallback}>
      {children}
    </PermissionGate>
  );
};

// ============================================
// ModuleGate - Renderizado condicional por módulo
// ============================================
interface ModuleGateProps {
  module: Module;
  children: ReactNode;
  fallback?: ReactNode;
}

export const ModuleGate = ({
  module,
  children,
  fallback = null,
}: ModuleGateProps) => {
  return (
    <PermissionGate module={module} fallback={fallback}>
      {children}
    </PermissionGate>
  );
};

// ============================================
// RoleGate - Renderizado condicional por rol
// ============================================
interface RoleGateProps {
  roles: UserRole | UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const RoleGate = ({
  roles,
  children,
  fallback = null,
}: RoleGateProps) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  return (
    <PermissionGate roles={roleArray} fallback={fallback}>
      {children}
    </PermissionGate>
  );
};

// ============================================
// AdminOnly - Solo para administradores
// ============================================
interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AdminOnly = ({ children, fallback = null }: AdminOnlyProps) => {
  return (
    <RoleGate roles="admin" fallback={fallback}>
      {children}
    </RoleGate>
  );
};

// ============================================
// Export del índice
// ============================================
// src/features/permissions/ui/index.ts
/*
export { PermissionGate } from './PermissionGate';
export { Can } from './PermissionGate';
export { ModuleGate } from './PermissionGate';
export { RoleGate } from './PermissionGate';
export { AdminOnly } from './PermissionGate';
*/
