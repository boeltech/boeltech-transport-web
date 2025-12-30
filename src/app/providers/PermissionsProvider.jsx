// src/app/providers/PermissionsProvider.jsx

import { createContext, useContext } from "react";
import { useAuthContext } from "./AuthProvider"; // ✅ CORRECTO: Import desde AuthProvider
import { ROLES } from "@shared/constants/roles";

const PermissionsContext = createContext(null);

/**
 * Matriz de permisos por rol
 * Define qué puede hacer cada rol en el sistema
 */
export const PERMISSIONS = {
  // Administrador tiene acceso total
  administrador: ["*"],

  // Gerente de Operaciones
  gerente: [
    // Vehículos
    "vehicles.read",
    "vehicles.create",
    "vehicles.update",
    "vehicles.delete",

    // Viajes
    "trips.read",
    "trips.create",
    "trips.update",
    "trips.delete",

    // Conductores
    "drivers.read",
    "drivers.create",
    "drivers.update",
    "drivers.delete",

    // Mantenimiento
    "maintenance.read",
    "maintenance.create",
    "maintenance.update",
    "maintenance.delete",

    // Refacciones
    "parts.read",
    "parts.create",
    "parts.update",

    // Combustible
    "fuel.read",
    "fuel.create",
    "fuel.update",

    // Clientes
    "customers.read",
    "customers.create",
    "customers.update",

    // Reportes
    "reports.fleet",
    "reports.trips",
    "reports.fuel",
    "reports.maintenance",

    // Dashboard
    "dashboard.read",
  ],

  // Contador
  contador: [
    // Facturas
    "invoices.read",
    "invoices.create",
    "invoices.update",
    "invoices.delete",
    "invoices.pdf",

    // Gastos
    "expenses.read",
    "expenses.create",
    "expenses.update",
    "expenses.delete",

    // Reportes financieros
    "reports.financial",
    "reports.expenses",
    "reports.profitability",

    // Solo lectura de otros módulos
    "customers.read",
    "vehicles.read",
    "trips.read",
    "drivers.read",

    // Dashboard
    "dashboard.read",
  ],

  // Operador
  operador: [
    // Viajes
    "trips.create",
    "trips.update",
    "trips.read",

    // Gastos
    "expenses.create",
    "expenses.read",

    // Mantenimiento
    "maintenance.create",
    "maintenance.read",

    // Combustible
    "fuel.create",
    "fuel.read",

    // Solo lectura
    "vehicles.read",
    "drivers.read",

    // Dashboard básico
    "dashboard.read",
  ],

  // Cliente
  cliente: ["trips.read", "invoices.read", "invoices.pdf"],
};

/**
 * PermissionsProvider - Proveedor de permisos RBAC
 * Determina qué puede hacer cada usuario según su rol
 */
export const PermissionsProvider = ({ children }) => {
  // ✅ CORRECTO: Obtener user desde AuthProvider
  const { user } = useAuthContext();

  /**
   * Obtener permisos del usuario actual
   */
  const getUserPermissions = () => {
    if (!user?.role) return [];
    return PERMISSIONS[user.role] || [];
  };

  /**
   * Verificar si el usuario tiene un permiso específico
   * @param {string} permission - Permiso a verificar (ej: 'vehicles.create')
   * @returns {boolean}
   */
  const can = (permission) => {
    const userPermissions = getUserPermissions();

    // Administrador tiene acceso total
    if (userPermissions.includes("*")) return true;

    // Verificar permiso específico
    return userPermissions.includes(permission);
  };

  /**
   * Verificar si el usuario tiene al menos uno de los permisos
   * @param {string[]} permissions - Array de permisos
   * @returns {boolean}
   */
  const canAny = (permissions) => {
    return permissions.some((permission) => can(permission));
  };

  /**
   * Verificar si el usuario tiene todos los permisos
   * @param {string[]} permissions - Array de permisos
   * @returns {boolean}
   */
  const canAll = (permissions) => {
    return permissions.every((permission) => can(permission));
  };

  /**
   * Verificar si el usuario tiene un rol específico
   * @param {string} role - Rol a verificar
   * @returns {boolean}
   */
  const hasRole = (role) => {
    return user?.role === role;
  };

  /**
   * Verificar si el usuario tiene alguno de los roles
   * @param {string[]} roles - Array de roles
   * @returns {boolean}
   */
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  /**
   * Verificar si el usuario es administrador
   * @returns {boolean}
   */
  const isAdmin = () => {
    return hasRole(ROLES.ADMINISTRADOR);
  };

  /**
   * Verificar si el usuario es gerente
   * @returns {boolean}
   */
  const isManager = () => {
    return hasRole(ROLES.GERENTE);
  };

  /**
   * Verificar si el usuario es contador
   * @returns {boolean}
   */
  const isAccountant = () => {
    return hasRole(ROLES.CONTADOR);
  };

  /**
   * Verificar si el usuario es operador
   * @returns {boolean}
   */
  const isOperator = () => {
    return hasRole(ROLES.OPERADOR);
  };

  /**
   * Verificar si el usuario es cliente
   * @returns {boolean}
   */
  const isClient = () => {
    return hasRole(ROLES.CLIENTE);
  };

  // Valores y funciones expuestas
  const value = {
    // Verificación de permisos
    can,
    canAny,
    canAll,
    getUserPermissions,

    // Verificación de roles
    hasRole,
    hasAnyRole,

    // Helpers de roles
    isAdmin,
    isManager,
    isAccountant,
    isOperator,
    isClient,

    // Info del usuario (redundante con useAuth, pero útil)
    userRole: user?.role,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

/**
 * Hook personalizado para usar el PermissionsContext
 * @returns {Object} Contexto de permisos
 */
export const usePermissions = () => {
  const context = useContext(PermissionsContext);

  if (!context) {
    throw new Error(
      "usePermissions debe ser usado dentro de un PermissionsProvider"
    );
  }

  return context;
};

// Export del contexto (opcional)
export { PermissionsContext };
