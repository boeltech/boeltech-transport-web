/**
 * User Roles Constants (Frontend)
 *
 * Defines the 7 official roles for the laTuno (Boeltech) tenant RBAC system.
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
 * Portal roles (`client` / `driver`) are outside the SaaS subscription paywall
 * (ADR-0064): they must not hit billing soft-gate queries or “no plan” UX when
 * the API returns 403 for missing `billing.read`.
 */
export function isSubscriptionPaywallExemptRole(
  role: UserRole | null | undefined,
): boolean {
  return role === ROLES.CLIENT || role === ROLES.DRIVER;
}

/**
 * UX de consulta del rol `client` (portal): envíos + facturas propias.
 * No incluye `driver` (necesita captura de estado / tracking).
 */
export function isClientPortalRole(
  role: UserRole | null | undefined,
): boolean {
  return role === ROLES.CLIENT;
}

/**
 * UX operativa del rol `driver` (portal): sus viajes + seguimiento.
 * Distinto de `isClientPortalRole` y de paywall-exempt.
 */
export function isDriverPortalRole(
  role: UserRole | null | undefined,
): boolean {
  return role === ROLES.DRIVER;
}

/**
 * Portal tenant (client | driver): lean chrome, sin alertas de flota/ops staff.
 */
export function isTenantPortalRole(
  role: UserRole | null | undefined,
): boolean {
  return isClientPortalRole(role) || isDriverPortalRole(role);
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
 * Roles that `actorRole` may assign when creating or editing tenant users (Fase 2).
 * `admin` may assign any role. Other roles may only assign roles strictly below their level.
 */
export function getAssignableRolesForUserManagement(actorRole: UserRole): UserRole[] {
  if (actorRole === ROLES.ADMIN) {
    return getAllRoles();
  }
  return getAllRoles().filter((r) => ROLE_HIERARCHY[r] < ROLE_HIERARCHY[actorRole]);
}

/**
 * Options for role `<Select>` in user management forms.
 * On edit, always includes `targetUserRole` so the current value remains a valid item.
 */
export function getRoleOptionsForUserManagementForm(
  actorRole: UserRole,
  mode: "create" | "edit",
  targetUserRole?: UserRole,
): { value: UserRole; label: string }[] {
  const assignable = new Set(getAssignableRolesForUserManagement(actorRole));
  if (mode === "edit" && targetUserRole) {
    assignable.add(targetUserRole);
  }
  return ROLE_OPTIONS.filter((o) => assignable.has(o.value));
}

/** Rol por defecto en alta de usuario: el más alto que el actor aún puede asignar. */
export function getDefaultAssignableRoleForUserCreate(actorRole: UserRole): UserRole {
  const assignable = getAssignableRolesForUserManagement(actorRole);
  if (assignable.length === 0) {
    return ROLES.CLIENT;
  }
  return assignable.reduce((best, r) =>
    ROLE_HIERARCHY[r] > ROLE_HIERARCHY[best] ? r : best,
  assignable[0]!);
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
