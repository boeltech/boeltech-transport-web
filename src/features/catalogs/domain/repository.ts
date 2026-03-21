/**
 * Catalog Repository Interface
 * Clean Architecture - Domain Layer (Ports)
 *
 * Define los DTOs y la interfaz del repositorio.
 * La implementación está en la capa de infraestructura.
 */

import type { MappedSingleResult } from "@shared/api";
import type {
  CatalogType,
  CatalogItem,
  CatalogOption,
  CatalogVersion,
  CatalogTypeCodeValue,
  CatalogSearchParams,
  CatalogFilterParams,
} from "./entities";

// ============================================================================
// DTOs - Create (para catálogos tenant-specific)
// ============================================================================

export interface CreateCatalogItemDTO {
  code: string;
  name: string;
  description?: string | null;
  parentCode?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ============================================================================
// DTOs - Update
// ============================================================================

export interface UpdateCatalogItemDTO {
  name?: string;
  description?: string | null;
  parentCode?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ============================================================================
// Result Types
// ============================================================================

export interface CatalogSearchResult {
  items: CatalogItem[];
  total: number;
}

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * Interfaz del repositorio de catálogos.
 * Define el contrato que debe implementar la capa de infraestructura.
 */
export interface ICatalogRepository {
  // ─────────────────────────────────────────────────────────────────────────
  // Catalog Types
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Obtiene todos los tipos de catálogo
   */
  findTypes(): Promise<CatalogType[]>;

  // ─────────────────────────────────────────────────────────────────────────
  // Catalog Items - Read
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Obtiene todos los items de un catálogo (solo para catálogos pequeños)
   */
  findAll(
    typeCode: CatalogTypeCodeValue,
    filters?: CatalogFilterParams,
  ): Promise<CatalogItem[]>;

  /**
   * Obtiene items como opciones ligeras (para dropdowns)
   */
  findAllAsOptions(
    typeCode: CatalogTypeCodeValue,
    parentCode?: string,
  ): Promise<CatalogOption[]>;

  /**
   * Obtiene un item por código exacto
   */
  findByCode(
    typeCode: CatalogTypeCodeValue,
    code: string,
  ): Promise<CatalogItem | null>;

  /**
   * Obtiene los hijos de un item (catálogos jerárquicos)
   */
  findChildren(
    typeCode: CatalogTypeCodeValue,
    parentCode: string,
  ): Promise<CatalogItem[]>;

  /**
   * Busca items usando full-text search
   */
  search(
    typeCode: CatalogTypeCodeValue,
    params: CatalogSearchParams,
  ): Promise<CatalogSearchResult>;

  // ─────────────────────────────────────────────────────────────────────────
  // Catalog Items - Write (tenant-specific only)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Crea un nuevo item de catálogo
   */
  create(
    typeCode: CatalogTypeCodeValue,
    data: CreateCatalogItemDTO,
  ): Promise<MappedSingleResult<CatalogItem>>;

  /**
   * Actualiza un item de catálogo
   */
  update(
    typeCode: CatalogTypeCodeValue,
    code: string,
    data: UpdateCatalogItemDTO,
  ): Promise<MappedSingleResult<CatalogItem>>;

  /**
   * Elimina un item de catálogo
   */
  delete(typeCode: CatalogTypeCodeValue, code: string): Promise<void>;

  // ─────────────────────────────────────────────────────────────────────────
  // Versions
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Obtiene la versión actual de un catálogo
   */
  findCurrentVersion(
    typeCode: CatalogTypeCodeValue,
  ): Promise<CatalogVersion | null>;

  // ─────────────────────────────────────────────────────────────────────────
  // Utility
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Obtiene el conteo de items en un catálogo
   */
  count(typeCode: CatalogTypeCodeValue): Promise<number>;
}
