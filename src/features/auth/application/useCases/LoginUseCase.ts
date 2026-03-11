/**
 * Auth Application - Use Cases
 * Clean Architecture - Application Layer
 *
 * Casos de uso del dominio de autenticación.
 *
 * Ubicación: src/features/auth/application/useCases.ts
 */

import {
  User,
  Tenant,
  Token,
  type LoginCredentials,
  type IAuthRepository,
  type ITokenStorage,
} from "../../domain";

// ============================================
// LOGIN USE CASE
// ============================================

export interface LoginUseCaseResult {
  user: User;
  accessToken: Token;
}

/**
 * Caso de Uso: Login
 *
 * Responsabilidades:
 * 1. Validar credenciales
 * 2. Autenticar usuario contra el backend
 * 3. Crear entidades de dominio
 * 4. Persistir tokens y datos de usuario
 */
export class LoginUseCase {
  private readonly authRepository: IAuthRepository;
  private readonly tokenStorage: ITokenStorage;

  constructor(authRepository: IAuthRepository, tokenStorage: ITokenStorage) {
    this.authRepository = authRepository;
    this.tokenStorage = tokenStorage;
  }

  /**
   * Ejecuta el caso de uso de login
   */
  async execute(credentials: LoginCredentials): Promise<LoginUseCaseResult> {
    // 1. Validar entrada
    this.validateCredentials(credentials);

    // 2. Autenticar contra el backend
    const response = await this.authRepository.login({
      email: credentials.email,
      password: credentials.password,
      subdomain: credentials.subdomain,
    });

    // 3. Crear entidades de dominio
    const tenant = Tenant.create(response.user.tenant);
    const user = User.create({
      ...response.user,
      tenant,
    });

    const accessToken = Token.create(response.accessToken);
    const refreshToken = Token.create(response.refreshToken);

    // 4. Persistir en storage
    this.tokenStorage.setToken(accessToken.toString());
    this.tokenStorage.setRefreshToken(refreshToken.toString());
    this.tokenStorage.setUser(user.toJSON());
    this.tokenStorage.setSubdomain(credentials.subdomain);

    return { user, accessToken };
  }

  /**
   * Valida las credenciales de entrada
   */
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
