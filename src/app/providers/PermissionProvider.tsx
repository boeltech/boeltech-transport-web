import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthProvider";

// ============================================
// Tipos
// ============================================

interface PermissionContextType {
  /** Verifica si el usuario tiene un permiso específico */
  hasPermission: (permission: string) => boolean;
  /** Verifica si el usuario tiene TODOS los permisos especificados */
  hasAllPermissions: (permissions: string[]) => boolean;
  /** Verifica si el usuario tiene AL MENOS UNO de los permisos */
  hasAnyPermission: (permissions: string[]) => boolean;
  /** Verifica si el usuario tiene un rol específico */
  hasRole: (role: string | string[]) => boolean;
  /** Verifica si el usuario es admin */
  isAdmin: boolean;
  /** Lista de permisos del usuario */
  permissions: string[];
  /** Rol del usuario */
  role: string | null;
}

// ============================================
// Contexto
// ============================================

const PermissionContext = createContext<PermissionContextType | null>(null);

// ============================================
// Permisos por rol (fallback si no vienen del backend)
// ============================================

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["*"], // Admin tiene todos los permisos
  gerente: [
    // Operaciones
    "operations:trips:read",
    "operations:trips:write",
    "operations:tracking:read",
    // Flota
    "fleet:vehicles:read",
    "fleet:vehicles:write",
    "fleet:drivers:read",
    "fleet:drivers:write",
    "fleet:maintenance:read",
    "fleet:maintenance:write",
    "fleet:fuel:read",
    "fleet:fuel:write",
    // Clientes
    "clients:read",
    "clients:write",
    "quotes:read",
    "quotes:write",
    // Finanzas
    "finance:invoices:read",
    "finance:invoices:write",
    "finance:expenses:read",
    "finance:expenses:write",
    "finance:expenses:approve",
    "finance:payments:read",
    "finance:payments:write",
    // RRHH
    "hr:employees:read",
    "hr:employees:write",
    "hr:payroll:read",
    // Reportes
    "reports:read",
    "reports:export",
  ],
  contador: [
    // Finanzas
    "finance:invoices:read",
    "finance:invoices:write",
    "finance:expenses:read",
    "finance:expenses:write",
    "finance:payments:read",
    "finance:payments:write",
    // RRHH
    "hr:payroll:read",
    "hr:payroll:write",
    // Reportes financieros
    "reports:read",
    "reports:export",
    // Clientes (solo lectura para facturación)
    "clients:read",
  ],
  operador: [
    // Operaciones
    "operations:trips:read",
    "operations:trips:write",
    "operations:tracking:read",
    // Flota (solo lectura)
    "fleet:vehicles:read",
    "fleet:drivers:read",
    "fleet:maintenance:read",
    "fleet:fuel:read",
    "fleet:fuel:write",
    // Gastos propios
    "finance:expenses:read",
    "finance:expenses:write",
  ],
  cliente: [
    // Solo ver sus propios viajes y facturas
    "operations:trips:read",
    "finance:invoices:read",
    "quotes:read",
  ],
  user: [
    // Usuario básico - solo dashboard
  ],
};

// ============================================
// Provider
// ============================================

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider = ({ children }: PermissionProviderProps) => {
  const { user, isAuthenticated } = useAuth();

  // Obtener permisos del usuario
  const permissions = useMemo(() => {
    if (!isAuthenticated || !user) return [];

    // Si el usuario trae permisos del backend, usarlos
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions;
    }

    // Fallback: usar permisos por rol
    const role = user.role || "user";
    return ROLE_PERMISSIONS[role] || [];
  }, [user, isAuthenticated]);

  const role = user?.role || null;
  const isAdmin = role === "admin";

  // Verificar un permiso específico
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!isAuthenticated) return false;
      if (isAdmin) return true; // Admin tiene todos los permisos
      if (permissions.includes("*")) return true; // Wildcard

      // Verificar permiso exacto
      if (permissions.includes(permission)) return true;

      // Verificar permisos con wildcard parcial (ej: 'fleet:*' cubre 'fleet:vehicles:read')
      const parts = permission.split(":");
      for (let i = parts.length - 1; i > 0; i--) {
        const wildcardPermission = [...parts.slice(0, i), "*"].join(":");
        if (permissions.includes(wildcardPermission)) return true;
      }

      return false;
    },
    [isAuthenticated, isAdmin, permissions]
  );

  // Verificar TODOS los permisos
  const hasAllPermissions = useCallback(
    (requiredPermissions: string[]): boolean => {
      return requiredPermissions.every((p) => hasPermission(p));
    },
    [hasPermission]
  );

  // Verificar AL MENOS UN permiso
  const hasAnyPermission = useCallback(
    (requiredPermissions: string[]): boolean => {
      return requiredPermissions.some((p) => hasPermission(p));
    },
    [hasPermission]
  );

  // Verificar rol
  const hasRole = useCallback(
    (requiredRole: string | string[]): boolean => {
      if (!isAuthenticated || !role) return false;

      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      return roles.includes(role);
    },
    [isAuthenticated, role]
  );

  // Memoizar valor del contexto
  const value = useMemo<PermissionContextType>(
    () => ({
      hasPermission,
      hasAllPermissions,
      hasAnyPermission,
      hasRole,
      isAdmin,
      permissions,
      role,
    }),
    [
      hasPermission,
      hasAllPermissions,
      hasAnyPermission,
      hasRole,
      isAdmin,
      permissions,
      role,
    ]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// ============================================
// Hook
// ============================================

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);

  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }

  return context;
};

// ============================================
// Componente helper para renderizado condicional
// ============================================

interface CanProps {
  /** Permiso requerido */
  permission?: string;
  /** Permisos requeridos (todos) */
  permissions?: string[];
  /** Permisos requeridos (al menos uno) */
  anyPermissions?: string[];
  /** Roles permitidos */
  roles?: string[];
  /** Contenido a renderizar si tiene permiso */
  children: ReactNode;
  /** Contenido alternativo si no tiene permiso */
  fallback?: ReactNode;
}

export const Can = ({
  permission,
  permissions,
  anyPermissions,
  roles,
  children,
  fallback = null,
}: CanProps) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, hasRole } =
    usePermissions();

  let allowed = true;

  if (permission) {
    allowed = allowed && hasPermission(permission);
  }

  if (permissions && permissions.length > 0) {
    allowed = allowed && hasAllPermissions(permissions);
  }

  if (anyPermissions && anyPermissions.length > 0) {
    allowed = allowed && hasAnyPermission(anyPermissions);
  }

  if (roles && roles.length > 0) {
    allowed = allowed && hasRole(roles);
  }

  return <>{allowed ? children : fallback}</>;
};
