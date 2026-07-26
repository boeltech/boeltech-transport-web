/**
 * Auth Domain - Entities
 * Clean Architecture - Domain Layer
 *
 * Entidades del dominio de autenticación.
 *
 * Ubicación: src/features/auth/domain/entities.ts
 */

import { ROLES, type UserRole } from "@shared/constants/roles";

// ============================================
// TENANT ENTITY
// ============================================

/**
 * Datos para crear un Tenant
 */
export interface TenantData {
  id: string;
  name: string;
  subdomain: string;
}

/**
 * Entidad Tenant - Representa una empresa/organización en el sistema multi-tenant
 *
 * Reglas de negocio:
 * - El subdomain debe ser único y en minúsculas
 * - Solo caracteres alfanuméricos y guiones
 * - Todos los campos son requeridos
 */
export class Tenant {
  public readonly id: string;
  public readonly name: string;
  public readonly subdomain: string;

  private constructor(data: TenantData) {
    this.id = data.id;
    this.name = data.name;
    this.subdomain = data.subdomain;
    this.validate();
  }

  /**
   * Factory method para crear una instancia de Tenant
   */
  static create(data: TenantData): Tenant {
    return new Tenant(data);
  }

  /**
   * Validaciones de la entidad
   */
  private validate(): void {
    if (!this.id || this.id.trim() === "") {
      throw new Error("Tenant ID is required");
    }

    if (!this.name || this.name.trim() === "") {
      throw new Error("Tenant name is required");
    }

    if (!this.subdomain || this.subdomain.trim() === "") {
      throw new Error("Tenant subdomain is required");
    }

    // Validar formato de subdomain
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(this.subdomain)) {
      throw new Error(
        "Tenant subdomain must contain only lowercase letters, numbers, and hyphens",
      );
    }

    // Validar longitud del subdomain
    if (this.subdomain.length < 3 || this.subdomain.length > 50) {
      throw new Error("Tenant subdomain must be between 3 and 50 characters");
    }
  }

  /**
   * Convierte la entidad a objeto plano
   */
  toJSON(): TenantData {
    return {
      id: this.id,
      name: this.name,
      subdomain: this.subdomain,
    };
  }

  /**
   * Compara dos tenants por igualdad
   */
  equals(other: Tenant): boolean {
    return this.id === other.id;
  }
}

// ============================================
// USER ENTITY
// ============================================

/**
 * Datos para crear un User
 */
export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenant: Tenant | TenantData;
  lastLogin?: string | Date;
  permissions?: string[];
  /** ISO desde API; null = onboarding de producto pendiente */
  onboardingCompletedAt?: string | Date | null;
  /** ISO desde API; null = correo no verificado (AUTH-HARDEN soft-gate) */
  emailVerifiedAt?: string | Date | null;
}

/**
 * Datos serializados del User
 */
export interface UserJSON {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenant: TenantData;
  lastLogin?: string;
  permissions?: string[];
  onboardingCompletedAt?: string | null;
  emailVerifiedAt?: string | null;
}

/**
 * Entidad User - Representa un usuario autenticado en el sistema
 *
 * Reglas de negocio:
 * - El email debe tener formato válido
 * - Nombres no pueden estar vacíos
 * - Debe tener un tenant asociado
 * - Los permisos son opcionales (pueden venir del rol)
 */
export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly role: UserRole;
  public readonly tenant: Tenant;
  public readonly lastLogin?: Date;
  public readonly permissions?: string[];
  /** undefined = dato no cargado; null = onboarding pendiente */
  public readonly onboardingCompletedAt?: Date | null;
  /** undefined = no cargado; null = sin verificar */
  public readonly emailVerifiedAt?: Date | null;

  private constructor(
    data: UserData & {
      tenant: Tenant;
      lastLogin?: Date;
      onboardingCompletedAt?: Date | null;
      emailVerifiedAt?: Date | null;
    },
  ) {
    this.id = data.id;
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = data.role;
    this.tenant = data.tenant;
    this.lastLogin = data.lastLogin;
    this.permissions = data.permissions;
    this.onboardingCompletedAt = data.onboardingCompletedAt;
    this.emailVerifiedAt = data.emailVerifiedAt;
    this.validate();
  }

  /**
   * Factory method para crear una instancia de User
   */
  static create(data: UserData): User {
    // Convertir tenant a entidad si viene como objeto plano
    const tenant =
      data.tenant instanceof Tenant ? data.tenant : Tenant.create(data.tenant);

    // Convertir lastLogin a Date si viene como string
    let lastLoginDate: Date | undefined;
    if (data.lastLogin) {
      lastLoginDate =
        typeof data.lastLogin === "string"
          ? new Date(data.lastLogin)
          : data.lastLogin;
    }

    let onboardingDate: Date | null | undefined;
    if (data.onboardingCompletedAt === undefined) {
      onboardingDate = undefined;
    } else if (data.onboardingCompletedAt === null) {
      onboardingDate = null;
    } else {
      onboardingDate =
        typeof data.onboardingCompletedAt === "string"
          ? new Date(data.onboardingCompletedAt)
          : data.onboardingCompletedAt;
    }

    let emailVerifiedDate: Date | null | undefined;
    if (data.emailVerifiedAt === undefined) {
      emailVerifiedDate = undefined;
    } else if (data.emailVerifiedAt === null) {
      emailVerifiedDate = null;
    } else {
      emailVerifiedDate =
        typeof data.emailVerifiedAt === "string"
          ? new Date(data.emailVerifiedAt)
          : data.emailVerifiedAt;
    }

    return new User({
      ...data,
      tenant,
      lastLogin: lastLoginDate,
      onboardingCompletedAt: onboardingDate,
      emailVerifiedAt: emailVerifiedDate,
    });
  }

  /**
   * Recrea un User desde JSON (localStorage)
   */
  static fromJSON(json: UserJSON): User {
    return User.create({
      ...json,
      tenant: Tenant.create(json.tenant),
      lastLogin: json.lastLogin ? new Date(json.lastLogin) : undefined,
      onboardingCompletedAt:
        json.onboardingCompletedAt === undefined
          ? undefined
          : json.onboardingCompletedAt === null
            ? null
            : new Date(json.onboardingCompletedAt),
      emailVerifiedAt:
        json.emailVerifiedAt === undefined
          ? undefined
          : json.emailVerifiedAt === null
            ? null
            : new Date(json.emailVerifiedAt),
    });
  }

  /**
   * Validaciones de la entidad
   */
  private validate(): void {
    if (!this.id || this.id.trim() === "") {
      throw new Error("User ID is required");
    }

    if (!this.email || this.email.trim() === "") {
      throw new Error("User email is required");
    }

    // Validación simple de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error("User email format is invalid");
    }

    if (!this.firstName || this.firstName.trim() === "") {
      throw new Error("User first name is required");
    }

    if (!this.lastName || this.lastName.trim() === "") {
      throw new Error("User last name is required");
    }

    if (!this.role) {
      throw new Error("User role is required");
    }

    if (!this.tenant) {
      throw new Error("User tenant is required");
    }
  }

  /**
   * Obtiene el nombre completo del usuario
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Obtiene las iniciales del usuario
   */
  getInitials(): string {
    const first = this.firstName?.[0] || "";
    const last = this.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "??";
  }

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin(): boolean {
    return this.role === ROLES.ADMIN;
  }

  /**
   * Obtiene el nombre del tenant
   */
  getTenantName(): string {
    return this.tenant.name;
  }

  /**
   * Obtiene el subdomain del tenant
   */
  getSubdomain(): string {
    return this.tenant.subdomain;
  }

  /**
   * Convierte la entidad a objeto plano (para serialización)
   */
  toJSON(): UserJSON {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      tenant: this.tenant.toJSON(),
      lastLogin: this.lastLogin?.toISOString(),
      permissions: this.permissions,
      onboardingCompletedAt:
        this.onboardingCompletedAt === undefined
          ? undefined
          : this.onboardingCompletedAt === null
            ? null
            : this.onboardingCompletedAt.toISOString(),
      emailVerifiedAt:
        this.emailVerifiedAt === undefined
          ? undefined
          : this.emailVerifiedAt === null
            ? null
            : this.emailVerifiedAt.toISOString(),
    };
  }

  /**
   * Compara dos usuarios por igualdad
   */
  equals(other: User): boolean {
    return this.id === other.id;
  }
}
