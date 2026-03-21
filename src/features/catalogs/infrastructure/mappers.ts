/**
 * Catalog API Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * Transforma los datos entre el formato de la API (snake_case)
 * y el formato del dominio (camelCase).
 *
 * FLUJO:
 * API Response (snake_case) → mapCatalogItem → Domain Entity (camelCase)
 * Domain DTO (camelCase) → toApiCreateCatalogItem → API Request (snake_case)
 */

import type {
  CatalogType,
  CatalogItem,
  CatalogOption,
  CatalogVersion,
  CatalogTypeCodeValue,
  CatalogSourceValue,
} from "../domain/entities";
import type {
  CreateCatalogItemDTO,
  UpdateCatalogItemDTO,
  CatalogSearchResult,
} from "../domain/repository";

// ============================================================================
// API RESPONSE TYPES (snake_case from backend)
// ============================================================================

export interface ApiCatalogTypeResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  source: string | null;
  parent_type_code: string | null;
  is_hierarchical: boolean;
  is_global: boolean;
  metadata_schema: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ApiCatalogItemResponse {
  id: string;
  tenant_id: string | null;
  catalog_type_id: string;
  code: string;
  name: string;
  description: string | null;
  parent_code: string | null;
  sort_order: number;
  is_active: boolean;
  valid_from: string | null;
  valid_to: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ApiCatalogOptionResponse {
  code: string;
  name: string;
  description?: string | null;
  parent_code?: string | null;
}

export interface ApiCatalogVersionResponse {
  id: string;
  catalog_type_id: string;
  version: string;
  published_at: string;
  source_url: string | null;
  notes: string | null;
  is_current: boolean;
  items_count: number;
  created_at: string;
}

export interface ApiCatalogSearchResponse {
  data: ApiCatalogItemResponse[];
  pagination: {
    total: number;
    limit: number;
  };
}

// ============================================================================
// MAPPERS: API → Domain
// ============================================================================

/**
 * Mapea un tipo de catálogo del API al dominio
 */
export function mapCatalogType(api: ApiCatalogTypeResponse): CatalogType {
  return {
    id: api.id,
    code: api.code as CatalogTypeCodeValue,
    name: api.name,
    description: api.description,
    source: api.source as CatalogSourceValue | null,
    parentTypeCode: api.parent_type_code as CatalogTypeCodeValue | null,
    isHierarchical: api.is_hierarchical,
    isGlobal: api.is_global,
    metadataSchema: api.metadata_schema,
    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at),
  };
}

/**
 * Mapea un item de catálogo del API al dominio
 */
export function mapCatalogItem(api: ApiCatalogItemResponse): CatalogItem {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    catalogTypeId: api.catalog_type_id,
    code: api.code,
    name: api.name,
    description: api.description,
    parentCode: api.parent_code,
    sortOrder: api.sort_order,
    isActive: api.is_active,
    validFrom: api.valid_from,
    validTo: api.valid_to,
    metadata: api.metadata,
    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at),
  };
}

/**
 * Mapea una opción de catálogo del API al dominio
 */
export function mapCatalogOption(api: ApiCatalogOptionResponse): CatalogOption {
  return {
    code: api.code,
    name: api.name,
    description: api.description,
    parentCode: api.parent_code,
  };
}

/**
 * Mapea una versión de catálogo del API al dominio
 */
export function mapCatalogVersion(
  api: ApiCatalogVersionResponse,
): CatalogVersion {
  return {
    id: api.id,
    catalogTypeId: api.catalog_type_id,
    version: api.version,
    publishedAt: api.published_at,
    sourceUrl: api.source_url,
    notes: api.notes,
    isCurrent: api.is_current,
    itemsCount: api.items_count,
    createdAt: new Date(api.created_at),
  };
}

// ============================================================================
// PUBLIC MAPPERS (for repository)
// ============================================================================

/**
 * Mapea array de tipos de catálogo
 */
export function mapCatalogTypes(response: {
  data: ApiCatalogTypeResponse[];
}): CatalogType[] {
  return response.data.map(mapCatalogType);
}

/**
 * Mapea array de items de catálogo
 */
export function mapCatalogItems(response: {
  data: ApiCatalogItemResponse[];
}): CatalogItem[] {
  return response.data.map(mapCatalogItem);
}

/**
 * Mapea array de opciones de catálogo
 */
export function mapCatalogOptions(response: {
  data: ApiCatalogOptionResponse[];
}): CatalogOption[] {
  return response.data.map(mapCatalogOption);
}

/**
 * Mapea respuesta de búsqueda
 */
export function mapCatalogSearchResult(
  response: ApiCatalogSearchResponse,
): CatalogSearchResult {
  return {
    items: response.data.map(mapCatalogItem),
    total: response.pagination.total,
  };
}

/**
 * Mapea respuesta de item único
 */
export function mapSingleCatalogItem(response: {
  data: ApiCatalogItemResponse;
}): CatalogItem {
  return mapCatalogItem(response.data);
}

/**
 * Mapea respuesta de versión
 */
export function mapSingleCatalogVersion(response: {
  data: ApiCatalogVersionResponse | null;
}): CatalogVersion | null {
  return response.data ? mapCatalogVersion(response.data) : null;
}

// ============================================================================
// MAPPERS: Domain → API (for requests)
// ============================================================================

/**
 * Convierte DTO de creación a formato API (snake_case)
 */
export function toApiCreateCatalogItem(
  dto: CreateCatalogItemDTO,
): Record<string, unknown> {
  return {
    code: dto.code,
    name: dto.name,
    description: dto.description ?? null,
    parent_code: dto.parentCode ?? null,
    sort_order: dto.sortOrder ?? 0,
    is_active: dto.isActive ?? true,
    valid_from: dto.validFrom ?? null,
    valid_to: dto.validTo ?? null,
    metadata: dto.metadata ?? null,
  };
}

/**
 * Convierte DTO de actualización a formato API (snake_case)
 */
export function toApiUpdateCatalogItem(
  dto: UpdateCatalogItemDTO,
): Record<string, unknown> {
  const apiData: Record<string, unknown> = {};

  if (dto.name !== undefined) apiData.name = dto.name;
  if (dto.description !== undefined) apiData.description = dto.description;
  if (dto.parentCode !== undefined) apiData.parent_code = dto.parentCode;
  if (dto.sortOrder !== undefined) apiData.sort_order = dto.sortOrder;
  if (dto.isActive !== undefined) apiData.is_active = dto.isActive;
  if (dto.validFrom !== undefined) apiData.valid_from = dto.validFrom;
  if (dto.validTo !== undefined) apiData.valid_to = dto.validTo;
  if (dto.metadata !== undefined) apiData.metadata = dto.metadata;

  return apiData;
}

/**
 * Construye query params para búsqueda
 */
export function toApiSearchParams(params: {
  query: string;
  parentCode?: string;
  limit?: number;
  includeInactive?: boolean;
}): Record<string, unknown> {
  const queryParams: Record<string, unknown> = {
    q: params.query,
  };

  if (params.parentCode) queryParams.parent_code = params.parentCode;
  if (params.limit) queryParams.limit = params.limit;
  if (params.includeInactive)
    queryParams.include_inactive = params.includeInactive;

  return queryParams;
}

/**
 * Construye query params para filtros
 */
export function toApiFilterParams(params?: {
  parentCode?: string;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}): Record<string, unknown> {
  if (!params) return {};

  const queryParams: Record<string, unknown> = {};

  if (params.parentCode) queryParams.parent_code = params.parentCode;
  if (params.includeInactive)
    queryParams.include_inactive = params.includeInactive;
  if (params.limit) queryParams.limit = params.limit;
  if (params.offset) queryParams.offset = params.offset;

  return queryParams;
}
