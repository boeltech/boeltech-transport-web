/**
 * Verify Auth Use Case
 */

import {
  User,
  Tenant,
  type IAuthRepository,
  type ITokenStorage,
} from "../../domain";
import {
  persistsAuthTokens,
  usesAuthCookies,
} from "../../infrastructure/sessionMode";

export class VerifyAuthUseCase {
  private readonly authRepository: IAuthRepository;
  private readonly tokenStorage: ITokenStorage;

  constructor(authRepository: IAuthRepository, tokenStorage: ITokenStorage) {
    this.authRepository = authRepository;
    this.tokenStorage = tokenStorage;
  }

  async execute(): Promise<User | null> {
    const token = this.tokenStorage.getToken();
    const hasCookieSessionHint =
      usesAuthCookies() &&
      (!persistsAuthTokens() || Boolean(this.tokenStorage.getUser()));

    if (!token && !hasCookieSessionHint) {
      console.log("[VerifyAuthUseCase] No session material found");
      return null;
    }

    try {
      console.log("[VerifyAuthUseCase] Verifying session with backend...");

      const userData = await this.authRepository.getProfile();

      console.log("[VerifyAuthUseCase] Session valid, user:", userData.email);

      const tenant = Tenant.create(userData.tenant);
      const user = User.create({
        ...userData,
        tenant,
      });

      this.tokenStorage.setUser(user.toJSON());

      return user;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown verification error";
      console.error(
        "[VerifyAuthUseCase] Token verification failed:",
        message,
      );
      return null;
    }
  }
}
