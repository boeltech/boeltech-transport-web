/**
 * Auth Application - Use Cases
 * Clean Architecture - Application Layer
 *
 * Casos de uso del dominio de autenticación.
 *
 * Ubicación: src/features/auth/application/useCases.ts
 */

import { type IAuthRepository, type ITokenStorage } from "../../domain";

// ============================================
// LOGOUT USE CASE
// ============================================

/**
 * Caso de Uso: Logout
 *
 * Responsabilidades:
 * 1. Invalidar refresh token en el backend
 * 2. Limpiar storage local (tokens y datos de usuario)
 *
 * NOTA: Siempre limpia el storage local, incluso si la llamada al backend falla
 */
export class LogoutUseCase {
  private readonly authRepository: IAuthRepository;
  private readonly tokenStorage: ITokenStorage;

  constructor(authRepository: IAuthRepository, tokenStorage: ITokenStorage) {
    this.authRepository = authRepository;
    this.tokenStorage = tokenStorage;
  }

  /**
   * Ejecuta el caso de uso de logout
   */
  async execute(): Promise<void> {
    try {
      // 1. Obtener refresh token
      const refreshToken = this.tokenStorage.getRefreshToken();

      // 2. Invalidar en el backend (si existe)
      if (refreshToken) {
        await this.authRepository.logout(refreshToken);
        console.log("[LogoutUseCase] Refresh token invalidated on backend");
      }
    } catch (error) {
      // No propagar el error, el logout local debe continuar
      console.error("[LogoutUseCase] Backend logout failed:", error);
    } finally {
      // 3. Siempre limpiar el storage local
      this.tokenStorage.clear();
      console.log("[LogoutUseCase] Local storage cleared");
    }
  }
}
