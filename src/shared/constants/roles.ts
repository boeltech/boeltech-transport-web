/**
 * User Roles Constants (Frontend)
 *
 * Defines the 7 official roles for the Boeltech ERP system.
 * Must match backend roles exactly.
 *
 * IMPORTANT:
 * - Role values are in English (matches backend/database)
 * - Labels are in Spanish (for UI display)
 * - These are the ONLY valid roles in the system
 */

// ============================================================================
// Role Values (English - used in code/API)
// ============================================================================

export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  DISPATCHER: "dispatcher",
  ACCOUNTANT: "accountant",
  OPERATOR: "operator",
  DRIVER: "driver",
  CLIENT: "client",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// ============================================================================
// Role Labels (Spanish - for UI display)
// ============================================================================

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  manager: "Gerente",
  dispatcher: "Despachador",
  accountant: "Contador",
  operator: "Operador",
  driver: "Conductor",
  client: "Cliente",
};

// ============================================================================
// Role Descriptions (Spanish - for tooltips/help)
// ============================================================================

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Acceso completo a todos los módulos del sistema",
  manager: "Gestión de viajes, unidades, conductores y mantenimiento",
  dispatcher: "Coordinación y asignación de viajes a conductores",
  accountant: "Módulos de costos, facturación y nómina",
  operator: "Registro de gastos, mantenimiento y operación diaria",
  driver: "Consulta y actualización de sus propios viajes asignados",
  client: "Consulta de viajes y facturas propias",
};

// ============================================================================
// Role Hierarchy (for UI permission checks)
// ============================================================================

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 7,
  manager: 6,
  dispatcher: 5,
  accountant: 4,
  operator: 3,
  driver: 2,
  client: 1,
};

// ============================================================================
// Role Options (for Select/Dropdown components)
// ============================================================================

export const ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: ROLE_LABELS.admin },
  { value: ROLES.MANAGER, label: ROLE_LABELS.manager },
  { value: ROLES.DISPATCHER, label: ROLE_LABELS.dispatcher },
  { value: ROLES.ACCOUNTANT, label: ROLE_LABELS.accountant },
  { value: ROLES.OPERATOR, label: ROLE_LABELS.operator },
  { value: ROLES.DRIVER, label: ROLE_LABELS.driver },
  { value: ROLES.CLIENT, label: ROLE_LABELS.client },
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a role has higher or equal hierarchy level than another
 */
export function hasRoleLevel(
  userRole: UserRole,
  requiredRole: UserRole,
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Validate if a string is a valid role
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(ROLES).includes(role as UserRole);
}

/**
 * Get role label in Spanish
 */
export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

/**
 * Get role description in Spanish
 */
export function getRoleDescription(role: UserRole): string {
  return ROLE_DESCRIPTIONS[role];
}

/**
 * Get all roles as array
 */
export function getAllRoles(): UserRole[] {
  return Object.values(ROLES);
}

/**
 * Get role color for badges/chips
 */
export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    admin: "red",
    manager: "orange",
    dispatcher: "purple",
    accountant: "yellow",
    operator: "green",
    driver: "blue",
    client: "slate",
  };
  return colors[role];
}

/**
 * Get role icon (Lucide React icon name)
 */
export function getRoleIcon(role: UserRole): string {
  const icons: Record<UserRole, string> = {
    admin: "Shield",
    manager: "Briefcase",
    dispatcher: "Radio",
    accountant: "Calculator",
    operator: "ClipboardList",
    driver: "Truck",
    client: "User",
  };
  return icons[role];
}
