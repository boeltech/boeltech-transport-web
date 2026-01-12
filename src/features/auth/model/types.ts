import type { UserRole } from "@features/permissions/model/types";

/**
 * Roles de usuario del sistema
 */
// export type UserRole =
//   | "admin"
//   | "gerente"
//   | "contador"
//   | "operador"
//   | "cliente";

/**
 * Usuario autenticado
 */
export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  avatar?: string;
  permisos?: string[];
  activo: boolean;
  ultimoAcceso?: string;
}

/**
 * Credenciales para login
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Respuesta del endpoint de login
 */
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn?: number;
}

/**
 * Estado de autenticación
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Errores de autenticación
 */
export interface AuthError {
  code:
    | "INVALID_CREDENTIALS"
    | "USER_INACTIVE"
    | "ACCOUNT_LOCKED"
    | "SERVER_ERROR";
  message: string;
}
