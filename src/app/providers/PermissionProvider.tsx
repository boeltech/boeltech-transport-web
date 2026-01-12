import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import type {
  PermissionState,
  Permission,
  Module,
  UserRole,
} from "@features/permissions/model/types";
import { useAuth } from "./AuthProvider";
import { ROLE_CONFIGS } from "@features/permissions/model/constants";

// ============================================
// Tipos del Contexto
// ============================================
interface PermissionContextType extends PermissionState {
  /** Verifica si tiene un permiso específico */
  hasPermission: (permission: Permission) => boolean;

  /** Verifica si tiene TODOS los permisos especificados */
  hasAllPermissions: (permissions: Permission[]) => boolean;

  /** Verifica si tiene AL MENOS UNO de los permisos */
  hasAnyPermission: (permissions: Permission[]) => boolean;

  /** Verifica si tiene acceso a un módulo */
  hasModuleAccess: (module: Module) => boolean;

  /** Verifica si tiene uno de los roles especificados */
  hasRole: (roles: UserRole | UserRole[]) => boolean;

  /** Verifica si es administrador */
  isAdmin: boolean;
}

// ============================================
// Contexto
// ============================================
const PermissionContext = createContext<PermissionContextType | null>(null);

// ============================================
// Provider
// ============================================
interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider = ({ children }: PermissionProviderProps) => {
  const { user, isAuthenticated } = useAuth();

  // ============================================
  // Derivar permisos del usuario
  // ============================================
  const state = useMemo<PermissionState>(() => {
    if (!isAuthenticated || !user) {
      return {
        permissions: [],
        moduleAccess: [],
        role: null,
        isLoaded: true,
      };
    }

    const role = user.rol as UserRole;
    const roleConfig = ROLE_CONFIGS[role];

    // Si el usuario tiene permisos personalizados, usarlos
    // Si no, usar los permisos del rol
    const permissions =
      user.permisos?.length > 0
        ? (user.permisos as Permission[])
        : roleConfig?.permissions || [];

    const moduleAccess = roleConfig?.moduleAccess || [];

    return {
      permissions,
      moduleAccess,
      role,
      isLoaded: true,
    };
  }, [user, isAuthenticated]);

  // ============================================
  // Verificar si es admin
  // ============================================
  const isAdmin = useMemo(() => state.role === "admin", [state.role]);

  // ============================================
  // Verificar permiso individual
  // ============================================
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      // Admin tiene todos los permisos
      if (isAdmin) return true;

      // Sin permisos cargados
      if (!state.isLoaded || state.permissions.length === 0) return false;

      // Verificar permiso exacto
      if (state.permissions.includes(permission)) return true;

      // Verificar wildcards (ej: "fleet:*:read" o "*:*:read")
      const [module, resource, action] = permission.split(":");

      const wildcardPatterns = [
        `${module}:${resource}:*`, // fleet:vehicles:*
        `${module}:*:${action}`, // fleet:*:read
        `${module}:*:*`, // fleet:*:*
        `*:${resource}:${action}`, // *:vehicles:read
        `*:*:${action}`, // *:*:read
        `*:*:*`, // *:*:*
      ];

      return wildcardPatterns.some((pattern) =>
        state.permissions.includes(pattern as Permission)
      );
    },
    [state.permissions, state.isLoaded, isAdmin]
  );

  // ============================================
  // Verificar múltiples permisos (AND)
  // ============================================
  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      if (isAdmin) return true;
      return permissions.every((p) => hasPermission(p));
    },
    [hasPermission, isAdmin]
  );

  // ============================================
  // Verificar múltiples permisos (OR)
  // ============================================
  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      if (isAdmin) return true;
      return permissions.some((p) => hasPermission(p));
    },
    [hasPermission, isAdmin]
  );

  // ============================================
  // Verificar acceso a módulo
  // ============================================
  const hasModuleAccess = useCallback(
    (module: Module): boolean => {
      if (isAdmin) return true;
      return state.moduleAccess.includes(module);
    },
    [state.moduleAccess, isAdmin]
  );

  // ============================================
  // Verificar rol
  // ============================================
  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!state.role) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(state.role);
    },
    [state.role]
  );

  // ============================================
  // Memoizar valor del contexto
  // ============================================
  const value = useMemo<PermissionContextType>(
    () => ({
      ...state,
      hasPermission,
      hasAllPermissions,
      hasAnyPermission,
      hasModuleAccess,
      hasRole,
      isAdmin,
    }),
    [
      state,
      hasPermission,
      hasAllPermissions,
      hasAnyPermission,
      hasModuleAccess,
      hasRole,
      isAdmin,
    ]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// ============================================
// Hook para consumir el contexto
// ============================================
export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);

  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }

  return context;
};
