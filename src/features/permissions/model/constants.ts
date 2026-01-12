import type { Module, Permission, RoleConfig, UserRole } from "./types";

/**
 * Permisos del sistema organizados por módulo
 * Formato: "modulo:recurso:accion"
 */
export const PERMISSIONS = {
  // ============================================
  // Dashboard
  // ============================================
  DASHBOARD: {
    VIEW: "dashboard:view:read" as Permission,
    VIEW_KPI: "dashboard:kpi:read" as Permission,
    VIEW_ALERTS: "dashboard:alerts:read" as Permission,
  },

  // ============================================
  // Flota (Fleet)
  // ============================================
  VEHICLES: {
    READ: "fleet:vehicles:read" as Permission,
    WRITE: "fleet:vehicles:write" as Permission,
    DELETE: "fleet:vehicles:delete" as Permission,
  },
  DRIVERS: {
    READ: "fleet:drivers:read" as Permission,
    WRITE: "fleet:drivers:write" as Permission,
    DELETE: "fleet:drivers:delete" as Permission,
  },
  MAINTENANCE: {
    READ: "fleet:maintenance:read" as Permission,
    WRITE: "fleet:maintenance:write" as Permission,
    DELETE: "fleet:maintenance:delete" as Permission,
    APPROVE: "fleet:maintenance:approve" as Permission,
  },
  FUEL: {
    READ: "fleet:fuel:read" as Permission,
    WRITE: "fleet:fuel:write" as Permission,
  },

  // ============================================
  // Operaciones
  // ============================================
  TRIPS: {
    READ: "operations:trips:read" as Permission,
    WRITE: "operations:trips:write" as Permission,
    DELETE: "operations:trips:delete" as Permission,
    ASSIGN: "operations:trips:approve" as Permission, // Asignar conductor/vehículo
  },
  ROUTES: {
    READ: "operations:routes:read" as Permission,
    WRITE: "operations:routes:write" as Permission,
  },

  // ============================================
  // Clientes
  // ============================================
  CLIENTS: {
    READ: "clients:clients:read" as Permission,
    WRITE: "clients:clients:write" as Permission,
    DELETE: "clients:clients:delete" as Permission,
  },

  // ============================================
  // Finanzas
  // ============================================
  INVOICES: {
    READ: "finance:invoices:read" as Permission,
    WRITE: "finance:invoices:write" as Permission,
    DELETE: "finance:invoices:delete" as Permission,
    STAMP: "finance:invoices:approve" as Permission, // Timbrar CFDI
  },
  EXPENSES: {
    READ: "finance:expenses:read" as Permission,
    WRITE: "finance:expenses:write" as Permission,
    DELETE: "finance:expenses:delete" as Permission,
    APPROVE: "finance:expenses:approve" as Permission,
  },
  PAYMENTS: {
    READ: "finance:payments:read" as Permission,
    WRITE: "finance:payments:write" as Permission,
  },

  // ============================================
  // Recursos Humanos
  // ============================================
  EMPLOYEES: {
    READ: "hr:employees:read" as Permission,
    WRITE: "hr:employees:write" as Permission,
    DELETE: "hr:employees:delete" as Permission,
  },
  PAYROLL: {
    READ: "hr:payroll:read" as Permission,
    WRITE: "hr:payroll:write" as Permission,
    APPROVE: "hr:payroll:approve" as Permission,
  },

  // ============================================
  // Inventario
  // ============================================
  PARTS: {
    READ: "inventory:parts:read" as Permission,
    WRITE: "inventory:parts:write" as Permission,
    DELETE: "inventory:parts:delete" as Permission,
  },

  // ============================================
  // Reportes
  // ============================================
  REPORTS: {
    VIEW_FLEET: "reports:fleet:read" as Permission,
    VIEW_OPERATIONS: "reports:operations:read" as Permission,
    VIEW_FINANCE: "reports:finance:read" as Permission,
    EXPORT: "reports:all:export" as Permission,
  },

  // ============================================
  // Administración
  // ============================================
  USERS: {
    READ: "admin:users:read" as Permission,
    WRITE: "admin:users:write" as Permission,
    DELETE: "admin:users:delete" as Permission,
  },
  ROLES: {
    READ: "admin:roles:read" as Permission,
    WRITE: "admin:roles:write" as Permission,
  },
  AUDIT: {
    READ: "admin:audit:read" as Permission,
    EXPORT: "admin:audit:export" as Permission,
  },
  SETTINGS: {
    READ: "admin:settings:read" as Permission,
    WRITE: "admin:settings:write" as Permission,
  },
} as const;

/**
 * Módulos del sistema
 */
export const MODULES: Record<Module, { name: string; icon: string }> = {
  dashboard: { name: "Dashboard", icon: "LayoutDashboard" },
  fleet: { name: "Flota", icon: "Truck" },
  operations: { name: "Operaciones", icon: "Route" },
  clients: { name: "Clientes", icon: "Users" },
  finance: { name: "Finanzas", icon: "DollarSign" },
  hr: { name: "Recursos Humanos", icon: "UserCog" },
  inventory: { name: "Inventario", icon: "Package" },
  reports: { name: "Reportes", icon: "BarChart3" },
  admin: { name: "Administración", icon: "Settings" },
};

/**
 * Configuración de permisos por rol según ERS
 */
export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  // ============================================
  // Administrador - Acceso total
  // ============================================
  admin: {
    name: "Administrador",
    description:
      "Control total del sistema. Acceso completo a todos los módulos.",
    moduleAccess: [
      "dashboard",
      "fleet",
      "operations",
      "clients",
      "finance",
      "hr",
      "inventory",
      "reports",
      "admin",
    ],
    permissions: [
      // Tiene todos los permisos - se maneja con lógica especial
      "*:*:read" as Permission,
      "*:*:write" as Permission,
      "*:*:delete" as Permission,
      "*:*:approve" as Permission,
      "*:*:export" as Permission,
    ],
  },

  // ============================================
  // Gerente de Operaciones
  // ============================================
  gerente: {
    name: "Gerente de Operaciones",
    description: "Gestión de viajes, flota, conductores y clientes.",
    moduleAccess: ["dashboard", "fleet", "operations", "clients", "reports"],
    permissions: [
      // Dashboard
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.DASHBOARD.VIEW_KPI,
      PERMISSIONS.DASHBOARD.VIEW_ALERTS,
      // Flota - Completo
      PERMISSIONS.VEHICLES.READ,
      PERMISSIONS.VEHICLES.WRITE,
      PERMISSIONS.DRIVERS.READ,
      PERMISSIONS.DRIVERS.WRITE,
      PERMISSIONS.MAINTENANCE.READ,
      PERMISSIONS.MAINTENANCE.WRITE,
      PERMISSIONS.MAINTENANCE.APPROVE,
      PERMISSIONS.FUEL.READ,
      PERMISSIONS.FUEL.WRITE,
      // Operaciones - Completo
      PERMISSIONS.TRIPS.READ,
      PERMISSIONS.TRIPS.WRITE,
      PERMISSIONS.TRIPS.ASSIGN,
      PERMISSIONS.ROUTES.READ,
      PERMISSIONS.ROUTES.WRITE,
      // Clientes - Lectura y escritura
      PERMISSIONS.CLIENTS.READ,
      PERMISSIONS.CLIENTS.WRITE,
      // Reportes - Solo lectura
      PERMISSIONS.REPORTS.VIEW_FLEET,
      PERMISSIONS.REPORTS.VIEW_OPERATIONS,
    ],
  },

  // ============================================
  // Contador
  // ============================================
  contador: {
    name: "Contador",
    description: "Gestión financiera, facturación, costos y nómina.",
    moduleAccess: ["dashboard", "finance", "hr", "reports"],
    permissions: [
      // Dashboard
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.DASHBOARD.VIEW_KPI,
      // Finanzas - Completo
      PERMISSIONS.INVOICES.READ,
      PERMISSIONS.INVOICES.WRITE,
      PERMISSIONS.INVOICES.STAMP,
      PERMISSIONS.EXPENSES.READ,
      PERMISSIONS.EXPENSES.WRITE,
      PERMISSIONS.EXPENSES.APPROVE,
      PERMISSIONS.PAYMENTS.READ,
      PERMISSIONS.PAYMENTS.WRITE,
      // HR - Nómina
      PERMISSIONS.EMPLOYEES.READ,
      PERMISSIONS.PAYROLL.READ,
      PERMISSIONS.PAYROLL.WRITE,
      PERMISSIONS.PAYROLL.APPROVE,
      // Reportes financieros
      PERMISSIONS.REPORTS.VIEW_FINANCE,
      PERMISSIONS.REPORTS.EXPORT,
    ],
  },

  // ============================================
  // Operador
  // ============================================
  operador: {
    name: "Operador",
    description: "Registro de viajes, gastos operativos y kilometraje.",
    moduleAccess: ["dashboard", "operations", "fleet"],
    permissions: [
      // Dashboard limitado
      PERMISSIONS.DASHBOARD.VIEW,
      // Operaciones - Solo registro
      PERMISSIONS.TRIPS.READ,
      PERMISSIONS.TRIPS.WRITE,
      // Flota - Solo lectura + registro de combustible
      PERMISSIONS.VEHICLES.READ,
      PERMISSIONS.DRIVERS.READ,
      PERMISSIONS.FUEL.READ,
      PERMISSIONS.FUEL.WRITE,
      // Gastos - Solo registro
      PERMISSIONS.EXPENSES.READ,
      PERMISSIONS.EXPENSES.WRITE,
    ],
  },

  // ============================================
  // Cliente
  // ============================================
  cliente: {
    name: "Cliente",
    description: "Consulta de viajes propios y facturas.",
    moduleAccess: ["dashboard"],
    permissions: [
      // Dashboard muy limitado (portal de cliente)
      PERMISSIONS.DASHBOARD.VIEW,
      // Solo puede ver SUS viajes y facturas (filtrado en backend)
      PERMISSIONS.TRIPS.READ,
      PERMISSIONS.INVOICES.READ,
    ],
  },
};

/**
 * Helper para obtener todos los permisos como array plano
 */
export const getAllPermissions = (): Permission[] => {
  const permissions: Permission[] = [];

  const extractPermissions = (obj: Record<string, unknown>) => {
    Object.values(obj).forEach((value) => {
      if (typeof value === "string") {
        permissions.push(value as Permission);
      } else if (typeof value === "object" && value !== null) {
        extractPermissions(value as Record<string, unknown>);
      }
    });
  };

  extractPermissions(PERMISSIONS);
  return permissions;
};

/**
 * Helper para obtener permisos de un módulo
 */
export const getModulePermissions = (module: Module): Permission[] => {
  return getAllPermissions().filter((p) => p.startsWith(`${module}:`));
};
