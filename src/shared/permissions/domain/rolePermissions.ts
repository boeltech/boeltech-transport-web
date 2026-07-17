/**
 * Permission Domain - Role Permissions Matrix
 * Clean Architecture - Domain Layer
 *
 * Define los permisos de cada rol del sistema.
 * Esta es la "fuente de verdad" para los permisos.
 *
 * UPDATED: Now uses the 7 official English roles with Spanish labels
 *
 * Ubicación: src/shared/auth/domain/rolePermissions.ts
 */

import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLES,
  type UserRole,
} from "@shared/constants/roles";
import { type PermissionString, type RoleDefinition } from "./entities";

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  // ==========================================================================
  // ADMIN - Acceso total al sistema
  // ==========================================================================
  admin: {
    role: ROLES.ADMIN,
    name: ROLE_LABELS.admin,
    description: ROLE_DESCRIPTIONS.admin,
    permissions: [], // Admin tiene todos los permisos por defecto (manejado en rules)
  },

  // ==========================================================================
  // MANAGER - Gerente de operaciones
  // ==========================================================================
  manager: {
    role: ROLES.MANAGER,
    name: ROLE_LABELS.manager,
    description: ROLE_DESCRIPTIONS.manager,
    permissions: [
      // Dashboard
      "dashboard.read",

      // Viajes - Control total
      "trips.read",
      "trips.create",
      "trips.update",
      "trips.delete",
      "trips.updateStatus",
      "trips.approve",
      "trips.export",
      "trips_stops_fiscal.execute",
      "trips_fiscal_edit.execute",

      // Vehículos - Control total
      "vehicles.read",
      "vehicles.create",
      "vehicles.update",
      "vehicles.delete",
      "vehicles.export",

      // Conductores - Control total
      "drivers.read",
      "drivers.create",
      "drivers.update",
      "drivers.delete",
      "drivers.assign",
      "drivers.updateStatus",
      "drivers.export",

      // Clientes - Control total
      "clients.read",
      "clients.create",
      "clients.update",
      "clients.delete",
      "clients.export",

      // Sucursales - Control total
      "branches.read",
      "branches.create",
      "branches.update",
      "branches.delete",
      "branches.export",

      // Empleados - Gestión
      "employees.read",
      "employees.create",
      "employees.update",
      "employees.export",

      // Mantenimiento - Control y aprobación
      "maintenance.read",
      "maintenance.create",
      "maintenance.update",
      "maintenance.delete",
      "maintenance.approve",
      "maintenance.export",

      // Combustible - Control y aprobación
      "fuel.read",
      "fuel.create",
      "fuel.update",
      "fuel.approve",
      "fuel.export",

      // Gastos - Lectura y aprobación
      "expenses.read",
      "expenses.approve",
      "expenses.export",

      // Aprobaciones centralizadas (hub /finance/approvals)
      "finance_approvals.read",
      "finance_approvals.update",

      // Facturas - Lectura
      "invoices.read",
      "invoices.create",
      "invoices.update",
      "invoices.delete",
      "invoices.execute",
      "invoices.export",

      // Nómina - Lectura
      "payroll.read",

      // Reportes - Todos
      "reports.read",
      "reports.create",
      "reports.export",
      "reports.execute",

      // Configuración - Lectura y actualización limitada
      "settings.read",
      "settings.update",

      // Catalogs — consulta global + CRUD internos (import SAT solo plataforma)
      "catalogs.read",
      "catalogs.create",
      "catalogs.update",
      "catalogs.delete",
    ],
  },

  // ==========================================================================
  // ACCOUNTANT - Contador (módulos financieros)
  // ==========================================================================
  accountant: {
    role: ROLES.ACCOUNTANT,
    name: ROLE_LABELS.accountant,
    description: ROLE_DESCRIPTIONS.accountant,
    permissions: [
      // Dashboard
      "dashboard.read",

      // Viajes - Solo lectura para contexto
      "trips.read",
      "trips.export",

      // Clientes - Lectura para facturación
      "clients.read",

      // Sucursales - Lectura para contexto administrativo
      "branches.read",

      // Empleados - Lectura para nómina
      "employees.read",

      // Combustible - Control y aprobación
      "fuel.read",
      "fuel.update",
      "fuel.approve",
      "fuel.export",

      // Gastos - Control total
      "expenses.read",
      "expenses.create",
      "expenses.update",
      "expenses.delete",
      "expenses.approve",
      "expenses.export",

      // Aprobaciones centralizadas (hub /finance/approvals)
      "finance_approvals.read",
      "finance_approvals.update",

      // Facturas - Control total
      "invoices.read",
      "invoices.create",
      "invoices.update",
      "invoices.approve",
      "invoices.export",
      "invoices.execute", // Timbrado, envío

      // Edición fiscal post-cierre (RFC parada)
      "trips_stops_fiscal.execute",
      "trips_fiscal_edit.execute",

      // Configuración - Lectura (incluye settings/billing GET)
      "settings.read",

      // SaaS billing read-only
      "billing.read",

      // Nómina - Control total
      "payroll.read",
      "payroll.create",
      "payroll.update",
      "payroll.delete",
      "payroll.approve",
      "payroll.export",
      "payroll.execute", // Procesar nómina, generar recibos

      // Pagos - Control total
      "payments.read",
      "payments.create",
      "payments.update",
      "payments.delete",
      "payments.export",

      // Reportes - Financieros
      "reports.read",
      "reports.create",
      "reports.export",
      "reports.execute",
    ],
  },

  // ==========================================================================
  // DISPATCHER - Despachador (coordinación de viajes)
  // ==========================================================================
  dispatcher: {
    role: ROLES.DISPATCHER,
    name: ROLE_LABELS.dispatcher,
    description: ROLE_DESCRIPTIONS.dispatcher,
    permissions: [
      // Dashboard
      "dashboard.read",

      // Viajes - Control total de coordinación
      "trips.read",
      "trips.create",
      "trips.update",
      "trips.updateStatus",
      "trips.assign",
      "trips.export",

      // Vehículos - Lectura y disponibilidad
      "vehicles.read",

      // Conductores - Lectura, asignación y estado
      "drivers.read",
      "drivers.assign",
      "drivers.updateStatus",

      // Clientes - Lectura para contexto de viajes
      "clients.read",

      // Sucursales - Lectura para coordinación operativa
      "branches.read",

      // Facturas - Lectura para prefill y contexto
      "invoices.read",

      // Reportes - Reportes de viajes
      "reports.read",
    ],
  },

  // ==========================================================================
  // OPERATOR - Operador (operaciones administrativas diarias)
  // ==========================================================================
  operator: {
    role: ROLES.OPERATOR,
    name: ROLE_LABELS.operator,
    description: ROLE_DESCRIPTIONS.operator,
    permissions: [
      // Dashboard
      "dashboard.read",

      // Viajes - CRUD completo + actualización de estado
      "trips.read",
      "trips.create",
      "trips.update",
      "trips.updateStatus",
      "trips.export",

      // Vehículos - Lectura
      "vehicles.read",

      // Conductores - Lectura + cambio de estado
      "drivers.read",
      "drivers.updateStatus",

      // Clientes - Lectura
      "clients.read",

      // Sucursales - Gestión operativa
      "branches.read",
      "branches.create",
      "branches.update",

      // Mantenimiento - CRUD
      "maintenance.read",
      "maintenance.create",
      "maintenance.update",
      "maintenance.export",

      // Combustible - CRUD
      "fuel.read",
      "fuel.create",
      "fuel.update",
      "fuel.export",

      // Gastos - CRUD
      "expenses.read",
      "expenses.create",
      "expenses.update",
      "expenses.export",

      // Reportes - Lectura limitada
      "reports.read",
    ],
  },

  // ==========================================================================
  // DRIVER - Conductor (app Android, solo sus viajes)
  // ==========================================================================
  driver: {
    role: ROLES.DRIVER,
    name: ROLE_LABELS.driver,
    description: ROLE_DESCRIPTIONS.driver,
    permissions: [
      // Dashboard - Vista básica
      "dashboard.read",

      // Viajes - Solo lectura y actualización de estado de sus viajes
      "trips.read",
      "trips.updateStatus", // Iniciar y completar su propio viaje

      // Vehículos - Lectura del vehículo asignado
      "vehicles.read",

      // Reportes - Historial de sus propios viajes
      "reports.read",
    ],
  },

  // ==========================================================================
  // CLIENT - Cliente externo (acceso limitado)
  // ==========================================================================
  client: {
    role: ROLES.CLIENT,
    name: ROLE_LABELS.client,
    description: ROLE_DESCRIPTIONS.client,
    permissions: [
      // Dashboard - Vista limitada
      "dashboard.read",

      // Viajes - Solo lectura de sus propios viajes
      "trips.read",

      // Facturas - lectura alineada con PERMISSIONS.invoices.read en API
      "invoices.read",

      // Reportes - Vista limitada de sus propios datos
      "reports.read",
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene los permisos de un rol
 */
export function getPermissionsForRole(role: UserRole): PermissionString[] {
  const definition = ROLE_DEFINITIONS[role];
  if (!definition) return [];
  return [...definition.permissions];
}

/**
 * Obtiene la definición de un rol
 */
export function getRoleDefinition(role: UserRole): RoleDefinition | undefined {
  return ROLE_DEFINITIONS[role];
}

/**
 * Obtiene el nombre legible de un rol (en español)
 */
export function getRoleName(role: UserRole): string {
  return ROLE_DEFINITIONS[role]?.name ?? role;
}

/**
 * Obtiene la descripción de un rol (en español)
 */
export function getRoleDescription(role: UserRole): string {
  return ROLE_DEFINITIONS[role]?.description ?? "";
}

/**
 * Obtiene todos los roles disponibles
 */
export function getAllRoles(): UserRole[] {
  return Object.keys(ROLE_DEFINITIONS) as UserRole[];
}

/**
 * Obtiene roles que pueden ser asignados (excluye admin por seguridad)
 */
export function getAssignableRoles(): UserRole[] {
  return getAllRoles().filter((role) => role !== ROLES.ADMIN);
}

/**
 * Verifica si un rol existe
 */
export function isValidRole(role: string): role is UserRole {
  return role in ROLE_DEFINITIONS;
}
