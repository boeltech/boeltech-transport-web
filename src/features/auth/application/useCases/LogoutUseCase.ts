/**
 * Logout Use Case
 */

import { type IAuthRepository, type ITokenStorage } from "../../domain";
import { usesAuthCookies } from "../../infrastructure/sessionMode";
import { platformTokenStorage } from "@features/platform/infrastructure/platformTokenStorage";

export class LogoutUseCase {
  private readonly authRepository: IAuthRepository;
  private readonly tokenStorage: ITokenStorage;

  constructor(authRepository: IAuthRepository, tokenStorage: ITokenStorage) {
    this.authRepository = authRepository;
    this.tokenStorage = tokenStorage;
  }

  async execute(): Promise<void> {
    try {
      const refreshToken = this.tokenStorage.getRefreshToken();
      if (refreshToken || usesAuthCookies()) {
        await this.authRepository.logout(refreshToken ?? undefined);
        console.log("[LogoutUseCase] Session invalidated on backend");
      }
    } catch (error) {
      console.error("[LogoutUseCase] Backend logout failed:", error);
    } finally {
      this.tokenStorage.clear();
      platformTokenStorage.clear();
      console.log("[LogoutUseCase] Local storage cleared");
    }
  }
}
