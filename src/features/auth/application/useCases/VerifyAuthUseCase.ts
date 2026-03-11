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
  type IAuthRepository,
  type ITokenStorage,
} from "../../domain";

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
