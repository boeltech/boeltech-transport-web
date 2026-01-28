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
} from "../domain";

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

// ============================================
// VERIFY AUTH USE CASE
// ============================================

/**
 * Caso de Uso: Verificar Autenticación
 *
 * Responsabilidades:
 * 1. Verificar si existe un token en el storage
 * 2. Validar el token contra el backend
 * 3. Obtener datos actualizados del usuario
 * 4. Crear entidad de dominio User
 * 5. Actualizar el usuario en el storage
 */
export class VerifyAuthUseCase {
  private readonly authRepository: IAuthRepository;
  private readonly tokenStorage: ITokenStorage;

  constructor(authRepository: IAuthRepository, tokenStorage: ITokenStorage) {
    this.authRepository = authRepository;
    this.tokenStorage = tokenStorage;
  }

  /**
   * Ejecuta el caso de uso de verificación
   */
  async execute(): Promise<User | null> {
    // 1. Verificar si existe un token
    const token = this.tokenStorage.getToken();

    if (!token) {
      console.log("[VerifyAuthUseCase] No token found in storage");
      return null;
    }

    try {
      console.log("[VerifyAuthUseCase] Token found, verifying with backend...");

      // 2. Validar token y obtener perfil del usuario
      const userData = await this.authRepository.getProfile();

      console.log("[VerifyAuthUseCase] Token valid, user:", userData.email);

      // 3. Crear entidades de dominio
      const tenant = Tenant.create(userData.tenant);
      const user = User.create({
        ...userData,
        tenant,
      });

      // 4. Actualizar usuario en storage
      this.tokenStorage.setUser(user.toJSON());

      return user;
    } catch (error: any) {
      console.error(
        "[VerifyAuthUseCase] Token verification failed:",
        error?.message,
      );

      // 5. Si la verificación falla, limpiar el storage
      this.tokenStorage.clear();

      return null;
    }
  }
}

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
