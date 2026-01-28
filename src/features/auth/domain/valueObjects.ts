/**
 * Auth Domain - Value Objects
 * Clean Architecture - Domain Layer
 *
 * Value Objects del dominio de autenticación.
 *
 * Ubicación: src/features/auth/domain/valueObjects.ts
 */

// ============================================
// TOKEN VALUE OBJECT
// ============================================

/**
 * Value Object Token - Representa un token JWT
 *
 * Reglas de negocio:
 * - No puede estar vacío
 * - Debe tener formato JWT válido (xxx.yyy.zzz)
 * - Es inmutable
 */
export class Token {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
    this.validate();
  }

  /**
   * Factory method para crear una instancia de Token
   */
  static create(value: string): Token {
    return new Token(value);
  }

  /**
   * Validaciones del value object
   */
  private validate(): void {
    if (!this.value || this.value.trim() === "") {
      throw new Error("Token cannot be empty");
    }

    // Validación básica de formato JWT (3 partes separadas por punto)
    const parts = this.value.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT token format (expected xxx.yyy.zzz)");
    }

    // Verificar que cada parte tenga contenido
    if (parts.some((part) => part.length === 0)) {
      throw new Error("Invalid JWT token format (empty parts)");
    }
  }

  /**
   * Convierte el token a string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Compara dos tokens por igualdad
   */
  equals(other: Token): boolean {
    return this.value === other.value;
  }

  /**
   * Extrae el payload del JWT (sin verificar firma)
   * PRECAUCIÓN: Solo para debugging, no usar para validación
   */
  getPayload(): Record<string, any> {
    try {
      const base64Url = this.value.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error("Failed to decode JWT payload");
    }
  }

  /**
   * Verifica si el token ha expirado (basado en el payload)
   * PRECAUCIÓN: No valida la firma, solo lee el claim 'exp'
   */
  isExpired(): boolean {
    try {
      const payload = this.getPayload();
      if (!payload.exp) return false;

      const expirationTime = payload.exp * 1000; // Convertir a milisegundos
      return Date.now() >= expirationTime;
    } catch {
      return true; // Si no se puede decodificar, asumir expirado
    }
  }

  /**
   * Obtiene el tiempo restante en segundos
   */
  getTimeRemaining(): number {
    try {
      const payload = this.getPayload();
      if (!payload.exp) return Infinity;

      const expirationTime = payload.exp * 1000;
      const remaining = (expirationTime - Date.now()) / 1000;
      return Math.max(0, remaining);
    } catch {
      return 0;
    }
  }
}

// ============================================
// CREDENTIALS VALUE OBJECT
// ============================================

/**
 * Credenciales de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
  subdomain: string;
  rememberMe?: boolean;
}

/**
 * Value Object Credentials - Representa credenciales de autenticación
 */
export class Credentials {
  public readonly email: string;
  public readonly password: string;
  public readonly subdomain: string;
  public readonly rememberMe: boolean;

  private constructor(data: LoginCredentials) {
    this.email = data.email.trim().toLowerCase();
    this.password = data.password;
    this.subdomain = data.subdomain.trim().toLowerCase();
    this.rememberMe = data.rememberMe ?? false;
    this.validate();
  }

  /**
   * Factory method
   */
  static create(data: LoginCredentials): Credentials {
    return new Credentials(data);
  }

  /**
   * Validaciones
   */
  private validate(): void {
    if (!this.email) {
      throw new Error("Email is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error("Invalid email format");
    }

    if (!this.password) {
      throw new Error("Password is required");
    }

    if (this.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    if (!this.subdomain) {
      throw new Error("Subdomain is required");
    }

    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(this.subdomain)) {
      throw new Error("Invalid subdomain format");
    }
  }

  /**
   * Convierte a objeto plano para enviar al API
   */
  toJSON(): Omit<LoginCredentials, "rememberMe"> {
    return {
      email: this.email,
      password: this.password,
      subdomain: this.subdomain,
    };
  }
}
