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
  CatalogStatistics,
  CatalogSearchParams,
  CatalogFilterParams,
  CatalogImportOptions,
  CatalogImportResult,
  CatalogValidationResult,
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

export interface ICatalogRepository {
  // ─────────────────────────────────────────────────────────────────────────
  // Catalog Types
  // ─────────────────────────────────────────────────────────────────────────

  findTypes(): Promise<CatalogType[]>;
  findTypesGrouped(): Promise<Record<string, CatalogType[]>>;

  // ─────────────────────────────────────────────────────────────────────────
  // Statistics
  // ─────────────────────────────────────────────────────────────────────────

  getStatistics(): Promise<CatalogStatistics[]>;

  // ─────────────────────────────────────────────────────────────────────────
  // Catalog Items - Read
  // ─────────────────────────────────────────────────────────────────────────

  findAll(
    typeCode: string,
    filters?: CatalogFilterParams,
  ): Promise<CatalogItem[]>;
  findAllAsOptions(
    typeCode: string,
    parentCode?: string,
  ): Promise<CatalogOption[]>;
  findByCode(typeCode: string, code: string): Promise<CatalogItem | null>;
  findChildren(typeCode: string, parentCode: string): Promise<CatalogItem[]>;
  search(
    typeCode: string,
    params: CatalogSearchParams,
  ): Promise<CatalogSearchResult>;

  // ─────────────────────────────────────────────────────────────────────────
  // Catalog Items - Write (tenant-specific only)
  // ─────────────────────────────────────────────────────────────────────────

  create(
    typeCode: string,
    data: CreateCatalogItemDTO,
  ): Promise<MappedSingleResult<CatalogItem>>;
  update(
    typeCode: string,
    code: string,
    data: UpdateCatalogItemDTO,
  ): Promise<MappedSingleResult<CatalogItem>>;
  delete(typeCode: string, code: string): Promise<void>;

  // ─────────────────────────────────────────────────────────────────────────
  // Import (admin/manager only)
  // ─────────────────────────────────────────────────────────────────────────

  importCatalog(
    typeCode: string,
    file: File,
    options: CatalogImportOptions,
  ): Promise<CatalogImportResult>;

  validateImport(
    typeCode: string,
    file: File,
  ): Promise<CatalogValidationResult>;

  // ─────────────────────────────────────────────────────────────────────────
  // Versions
  // ─────────────────────────────────────────────────────────────────────────

  findCurrentVersion(typeCode: string): Promise<CatalogVersion | null>;
  findVersions(typeCode: string): Promise<CatalogVersion[]>;

  // ─────────────────────────────────────────────────────────────────────────
  // Utility
  // ─────────────────────────────────────────────────────────────────────────

  count(typeCode: string): Promise<number>;
}
