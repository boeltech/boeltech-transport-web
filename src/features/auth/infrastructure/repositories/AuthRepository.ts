/**
 * Auth Repository
 * Clean Architecture - Infrastructure Layer
 *
 * Implementación del repositorio de autenticación.
 *
 * Ubicación: src/features/auth/infrastructure/repositories/AuthRepository.ts
 */

import { authApi } from "../api/authApi";
import type {
  IAuthRepository,
  AuthResponse,
  RefreshResponse,
  UserJSON,
} from "../../domain";

/**
 * Repositorio de Autenticación
 *
 * Implementa IAuthRepository.
 * Delega llamadas a authApi.
 */
export class AuthRepository implements IAuthRepository {
  /**
   * Autentica un usuario
   */
  async login(credentials: {
    email: string;
    password: string;
    subdomain: string;
  }): Promise<AuthResponse> {
    return authApi.login(credentials);
  }

  /**
   * Cierra la sesión de un usuario
   */
  async logout(refreshToken?: string): Promise<void> {
    return authApi.logout(refreshToken);
  }

  /**
   * Obtiene el perfil del usuario autenticado
   */
  async getProfile(): Promise<UserJSON> {
    return authApi.getProfile();
  }

  /**
   * Refresca el token de acceso
   */
  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    return authApi.refresh(refreshToken);
  }
}
