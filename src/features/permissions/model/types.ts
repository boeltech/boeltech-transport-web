/**
 * Roles del sistema según ERS
 */
export type UserRole =
  | "admin"
  | "gerente"
  | "contador"
  | "operador"
  | "cliente"
  | "user";

/**
 * Módulos del ERP
 */
export type Module =
  | "dashboard"
  | "fleet"
  | "operations"
  | "clients"
  | "finance"
  | "hr"
  | "inventory"
  | "reports"
  | "admin";

/**
 * Acciones posibles sobre recursos
 */
export type Action = "read" | "write" | "delete" | "approve" | "export";

/**
 * Formato de un permiso: "modulo:recurso:accion"
 * Ejemplos: "fleet:vehicles:read", "finance:invoices:approve"
 */
export type Permission =
  | `${string}:${string}:${Action}`
  | `${string}:${Action}`;

/**
 * Estructura de permisos del usuario
 */
export interface UserPermissions {
  role: UserRole;
  permissions: Permission[];
  moduleAccess: Module[];
}

/**
 * Configuración de un rol
 */
export interface RoleConfig {
  name: string;
  description: string;
  permissions: Permission[];
  moduleAccess: Module[];
}

/**
 * Estado del contexto de permisos
 */
export interface PermissionState {
  permissions: Permission[];
  moduleAccess: Module[];
  role: UserRole | null;
  isLoaded: boolean;
}
