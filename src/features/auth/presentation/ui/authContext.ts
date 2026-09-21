/**
 * AuthContext — modulo hoja (sin imports de infrastructure).
 * Evita ciclo AuthProvider → infrastructure → hooks → AuthProvider
 * que deja useAuth sin Provider tras login/HMR.
 */

import { createContext } from "react";
import type { AuthState, LoginCredentials, User, UserJSON } from "../../domain";

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  /** Actualiza sesión; devuelve el User cargado (o undefined si no hay sesión). */
  refreshProfile: () => Promise<User | undefined>;
  replaceSessionUser: (json: UserJSON, accessToken?: string) => void;
  applySessionTokens: (accessToken: string, refreshToken: string) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
