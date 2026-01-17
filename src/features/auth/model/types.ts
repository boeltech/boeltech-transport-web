import type { UserRole } from "@features/permissions";

/**
 * Roles de usuario del sistema
 * Deben coincidir con los roles definidos en el backend
 */
// export type UserRole =
//   | "admin"
//   | "gerente"
//   | "contador"
//   | "operador"
//   | "cliente"
//   | "user";

/**
 * Información del tenant (empresa)
 * Sistema multi-tenant: cada empresa tiene su propio subdomain
 */
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
}

/**
 * Usuario autenticado
 *
 * Estructura que devuelve el backend en:
 * - POST /api/v1/auth/login (dentro de response.user)
 * - GET /api/v1/auth/profile
 *
 * IMPORTANTE: Los campos deben coincidir con el backend:
 * - Backend usa: firstName, lastName, role
 * - NO usar: nombre, apellido, rol
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  lastLogin?: string;
  tenant: Tenant;
  permissions?: string[]; // Permisos específicos del usuario (opcional)
}

/**
 * Credenciales para login
 *
 * El backend requiere `subdomain` para identificar el tenant
 */
export interface LoginCredentials {
  email: string;
  password: string;
  subdomain: string;
  rememberMe?: boolean; // Solo usado en frontend
}

/**
 * Respuesta del endpoint POST /api/v1/auth/login
 *
 * IMPORTANTE: El backend devuelve `accessToken`, NO `token`
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * Estado de autenticación en el contexto
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Códigos de error de autenticación
 */
export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "USER_INACTIVE"
  | "ACCOUNT_LOCKED"
  | "TENANT_NOT_FOUND"
  | "TENANT_SUSPENDED"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "SERVER_ERROR";

/**
 * Error de autenticación
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

/**
 * Helper para obtener nombre completo del usuario
 */
export const getUserFullName = (user: User | null): string => {
  if (!user) return "";
  return `${user.firstName} ${user.lastName}`.trim();
};

/**
 * Helper para obtener iniciales del usuario
 */
export const getUserInitials = (user: User | null): string => {
  if (!user) return "??";
  const first = user.firstName?.[0] || "";
  const last = user.lastName?.[0] || "";
  return `${first}${last}`.toUpperCase() || "??";
};
