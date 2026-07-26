/**
 * Auth Application - Use Cases
 * Clean Architecture - Application Layer
 */

import {
  User,
  Tenant,
  Token,
  type LoginCredentials,
  type IAuthRepository,
  type ITokenStorage,
  isMfaChallenge,
} from "../../domain";
import { persistsAuthTokens } from "../../infrastructure/sessionMode";

export interface LoginUseCaseResult {
  user: User;
  accessToken: Token | null;
}

/**
 * Caso de Uso: Login
 *
 * El challenge MFA se resuelve en LoginPage (verifyMfaLogin).
 * En modo cookies no persiste tokens en localStorage.
 */
export class LoginUseCase {
  private readonly authRepository: IAuthRepository;
  private readonly tokenStorage: ITokenStorage;

  constructor(authRepository: IAuthRepository, tokenStorage: ITokenStorage) {
    this.authRepository = authRepository;
    this.tokenStorage = tokenStorage;
  }

  async execute(credentials: LoginCredentials): Promise<LoginUseCaseResult> {
    this.validateCredentials(credentials);

    const response = await this.authRepository.login({
      email: credentials.email,
      password: credentials.password,
      subdomain: credentials.subdomain,
    });

    if (isMfaChallenge(response)) {
      throw new Error(
        "Se requiere verificación MFA. Completa el segundo factor en el inicio de sesión.",
      );
    }

    const tenant = Tenant.create(response.user.tenant);
    const user = User.create({
      ...response.user,
      tenant,
    });

    if (persistsAuthTokens() && response.accessToken && response.refreshToken) {
      this.tokenStorage.setToken(response.accessToken);
      this.tokenStorage.setRefreshToken(response.refreshToken);
    } else {
      this.tokenStorage.removeToken();
      this.tokenStorage.removeRefreshToken();
    }

    this.tokenStorage.setUser(user.toJSON());
    this.tokenStorage.setSubdomain(credentials.subdomain);

    return {
      user,
      accessToken:
        persistsAuthTokens() && response.accessToken
          ? Token.create(response.accessToken)
          : null,
    };
  }

  private validateCredentials(credentials: LoginCredentials): void {
    if (!credentials.email || credentials.email.trim() === "") {
      throw new Error("Email is required");
    }

    if (!credentials.password || credentials.password.trim() === "") {
      throw new Error("Password is required");
    }

    if (!credentials.subdomain || credentials.subdomain.trim() === "") {
      throw new Error("Subdomain is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new Error("Invalid email format");
    }
  }
}
