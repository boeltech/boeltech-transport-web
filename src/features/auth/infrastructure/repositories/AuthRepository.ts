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
  LoginResult,
  ChangePasswordPayload,
  ChangePasswordResult,
  RefreshResponse,
  UpdateMyProfilePayload,
  UpdateProfileResult,
  UserJSON,
} from "../../domain";

/**
 * Repositorio de Autenticación
 *
 * Implementa IAuthRepository.
 * Delega llamadas a authApi.
 */
export class AuthRepository implements IAuthRepository {
  async login(credentials: {
    email: string;
    password: string;
    subdomain: string;
  }): Promise<LoginResult> {
    return authApi.login(credentials);
  }

  async logout(refreshToken?: string): Promise<void> {
    return authApi.logout(refreshToken);
  }

  async getProfile(): Promise<UserJSON> {
    return authApi.getProfile();
  }

  async updateProfile(
    payload: UpdateMyProfilePayload,
  ): Promise<UpdateProfileResult> {
    return authApi.updateProfile(payload);
  }

  async changePassword(
    payload: ChangePasswordPayload,
  ): Promise<ChangePasswordResult> {
    return authApi.changePassword(payload);
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    return authApi.refresh(refreshToken);
  }

  async completeProductOnboarding(): Promise<void> {
    return authApi.completeProductOnboarding();
  }
}
