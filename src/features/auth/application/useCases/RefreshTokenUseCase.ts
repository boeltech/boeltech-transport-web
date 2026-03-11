/**
 * Auth Application - Use Cases
 * Clean Architecture - Application Layer
 *
 * Casos de uso del dominio de autenticación.
 *
 * Ubicación: src/features/auth/application/useCases.ts
 */

import { Token, type IAuthRepository, type ITokenStorage } from "../../domain";

// ============================================
// REFRESH TOKEN USE CASE
// ============================================

/**
 * Caso de Uso: Refrescar Token
 *
 * Responsabilidades:
 * 1. Obtener refresh token del storage
 * 2. Solicitar nuevo access token al backend
 * 3. Persistir nuevo token
 */
export class RefreshTokenUseCase {
  private readonly authRepository: IAuthRepository;
  private readonly tokenStorage: ITokenStorage;

  constructor(authRepository: IAuthRepository, tokenStorage: ITokenStorage) {
    this.authRepository = authRepository;
    this.tokenStorage = tokenStorage;
  }

  /**
   * Ejecuta el caso de uso de refresh
   */
  async execute(): Promise<Token | null> {
    const refreshToken = this.tokenStorage.getRefreshToken();

    if (!refreshToken) {
      console.log("[RefreshTokenUseCase] No refresh token available");
      return null;
    }

    try {
      const response = await this.authRepository.refreshToken(refreshToken);
      const newToken = Token.create(response.accessToken);

      this.tokenStorage.setToken(newToken.toString());
      console.log("[RefreshTokenUseCase] Token refreshed successfully");

      return newToken;
    } catch (error) {
      console.error("[RefreshTokenUseCase] Token refresh failed:", error);
      this.tokenStorage.clear();
      return null;
    }
  }
}
