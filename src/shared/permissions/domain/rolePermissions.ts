/**
 * Permission Domain - Role Permissions Matrix
 * Clean Architecture - Domain Layer
 *
 * Define los permisos de cada rol del sistema.
 * Esta es la "fuente de verdad" para los permisos.
 *
 * Ubicación: src/shared/auth/domain/rolePermissions.ts
 */

import {
  type Role,
  type PermissionString,
  type RoleDefinition,
} from "./entities";

// ============================================
// ROLE DEFINITIONS
// ============================================

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  // ==========================================
  // ADMIN - Acceso total
  // ==========================================
  admin: {
    role: "admin",
    name: "Administrador",
    description: "Acceso completo a todas las funcionalidades del sistema",
    permissions: [], // Admin tiene todos los permisos por defecto (manejado en rules)
  },

  // ==========================================
  // MANAGER - Gerente de operaciones
  // ==========================================
  manager: {
    role: "manager",
    name: "Gerente",
    description: "Gestión completa de operaciones, personal y reportes",
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
      "drivers.export",

      // Clientes - Control total
      "clients.read",
      "clients.create",
      "clients.update",
      "clients.delete",
      "clients.export",

      // Mantenimiento - Control y aprobación
      "maintenance.read",
      "maintenance.create",
      "maintenance.update",
      "maintenance.delete",
      "maintenance.approve",
      "maintenance.export",

      // Combustible
      "fuel.read",
      "fuel.create",
      "fuel.update",
      "fuel.approve",
      "fuel.export",

      // Facturas - Control y aprobación
      "invoices.read",
      "invoices.create",
      "invoices.update",
      "invoices.approve",
      "invoices.export",

      // Reportes
      "reports.read",
      "reports.export",

      // Usuarios - Lectura
      "users.read",
    ],
    inheritsFrom: ["fleet_coordinator", "trip_coordinator"],
  },

  // ==========================================
  // FLEET COORDINATOR - Coordinador de flota
  // ==========================================
  fleet_coordinator: {
    role: "fleet_coordinator",
    name: "Coordinador de Flota",
    description: "Gestión de vehículos, mantenimiento y asignaciones",
    permissions: [
      "dashboard.read",

      // Viajes - Lectura y actualización de estado
      "trips.read",
      "trips.create",
      "trips.update",
      "trips.updateStatus",

      // Vehículos - Control
      "vehicles.read",
      "vehicles.create",
      "vehicles.update",

      // Conductores - Lectura y asignación
      "drivers.read",
      "drivers.assign",

      // Mantenimiento - Control
      "maintenance.read",
      "maintenance.create",
      "maintenance.update",

      // Combustible
      "fuel.read",
      "fuel.create",
      "fuel.update",
    ],
  },

  // ==========================================
  // TRIP COORDINATOR - Coordinador de viajes
  // ==========================================
  trip_coordinator: {
    role: "trip_coordinator",
    name: "Coordinador de Viajes",
    description: "Planificación y seguimiento de viajes",
    permissions: [
      "dashboard.read",

      // Viajes - Control completo
      "trips.read",
      "trips.create",
      "trips.update",
      "trips.updateStatus",
      "trips.assign",

      // Vehículos - Lectura
      "vehicles.read",

      // Conductores - Lectura y asignación
      "drivers.read",
      "drivers.assign",

      // Clientes - Lectura
      "clients.read",
    ],
  },

  // ==========================================
  // HR - Recursos Humanos
  // ==========================================
  hr: {
    role: "hr",
    name: "Recursos Humanos",
    description: "Gestión de personal y conductores",
    permissions: [
      "dashboard.read",

      // Conductores - Control total
      "drivers.read",
      "drivers.create",
      "drivers.update",
      "drivers.delete",
      "drivers.export",

      // Usuarios - Control
      "users.read",
      "users.create",
      "users.update",

      // Reportes de personal
      "reports.read",
    ],
  },

  // ==========================================
  // ACCOUNTANT - Contador
  // ==========================================
  accountant: {
    role: "accountant",
    name: "Contador",
    description: "Gestión financiera, facturación y reportes",
    permissions: [
      "dashboard.read",

      // Viajes - Solo lectura
      "trips.read",
      "trips.export",

      // Combustible - Control
      "fuel.read",
      "fuel.update",
      "fuel.approve",
      "fuel.export",

      // Facturas - Control total
      "invoices.read",
      "invoices.create",
      "invoices.update",
      "invoices.delete",
      "invoices.approve",
      "invoices.export",

      // Clientes - Lectura
      "clients.read",

      // Reportes
      "reports.read",
      "reports.export",
    ],
  },

  // ==========================================
  // OPERATOR - Operador
  // ==========================================
  operator: {
    role: "operator",
    name: "Operador",
    description: "Operaciones básicas del día a día",
    permissions: [
      "dashboard.read",

      // Viajes - Lectura y actualización de estado
      "trips.read",
      "trips.updateStatus",

      // Vehículos - Lectura
      "vehicles.read",

      // Conductores - Lectura
      "drivers.read",

      // Combustible - Registro
      "fuel.read",
      "fuel.create",
    ],
  },

  // ==========================================
  // DRIVER - Conductor
  // ==========================================
  driver: {
    role: "driver",
    name: "Conductor",
    description: "Acceso a viajes asignados y registro de información",
    permissions: [
      "dashboard.read",

      // Viajes - Solo sus viajes asignados
      "trips.read",
      "trips.updateStatus",

      // Vehículo asignado
      "vehicles.read",

      // Combustible - Registro
      "fuel.read",
      "fuel.create",

      // Mantenimiento - Reportar
      "maintenance.read",
      "maintenance.create",
    ],
  },

  // ==========================================
  // CLIENT - Cliente externo
  // ==========================================
  client: {
    role: "client",
    name: "Cliente",
    description: "Acceso limitado a sus viajes y facturas",
    permissions: [
      "dashboard.read",

      // Viajes - Solo los suyos
      "trips.read",

      // Facturas - Solo las suyas
      "invoices.read",
    ],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtiene los permisos de un rol
 */
export function getPermissionsForRole(role: Role): PermissionString[] {
  const definition = ROLE_DEFINITIONS[role];
  if (!definition) return [];
  return [...definition.permissions];
}

/**
 * Obtiene la definición de un rol
 */
export function getRoleDefinition(role: Role): RoleDefinition | undefined {
  return ROLE_DEFINITIONS[role];
}

/**
 * Obtiene el nombre legible de un rol
 */
export function getRoleName(role: Role): string {
  return ROLE_DEFINITIONS[role]?.name ?? role;
}

/**
 * Obtiene la descripción de un rol
 */
export function getRoleDescription(role: Role): string {
  return ROLE_DEFINITIONS[role]?.description ?? "";
}

/**
 * Obtiene todos los roles disponibles
 */
export function getAllRoles(): Role[] {
  return Object.keys(ROLE_DEFINITIONS) as Role[];
}

/**
 * Obtiene roles que pueden ser asignados (excluye admin por seguridad)
 */
export function getAssignableRoles(): Role[] {
  return getAllRoles().filter((role) => role !== "admin");
}
