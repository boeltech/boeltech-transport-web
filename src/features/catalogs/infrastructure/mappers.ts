/**
 * Catalog API Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * Transforma los datos entre el formato de la API (snake_case)
 * y el formato del dominio (camelCase).
 *
 * ACTUALIZADO: Agregado ApiCatalogTypeWithVersionResponse y mapCatalogTypeWithVersion
 */

import type {
  CatalogType,
  CatalogItem,
  CatalogOption,
  CatalogVersion,
  CatalogStatistics,
  CatalogImportResult,
  CatalogValidationResult,
  CatalogImportOptions,
  CatalogTypeCodeValue,
  CatalogSourceValue,
  CatalogTypeWithVersion,
  CatalogSearchParams,
} from "../domain";
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

/**
 * Respuesta del endpoint GET /types/:typeCode
 * Incluye versión actual e items count
 */
export interface ApiCatalogTypeWithVersionResponse extends ApiCatalogTypeResponse {
  current_version: ApiCatalogVersionResponse | null;
  items_count: number;
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

export interface ApiCatalogStatisticsResponse {
  type_code: string;
  type_name: string;
  source: string | null;
  item_count: number;
  current_version: string | null;
}

export interface ApiCatalogImportResultResponse {
  success: boolean;
  type_code: string;
  version: string;
  total_rows: number;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  errors: Array<{ row: number; errors: string[] }>;
  duration: number;
}

export interface ApiCatalogValidationResultResponse {
  is_valid: boolean;
  total_rows: number;
  valid_rows: number;
  errors: Array<{ row: number; errors: string[] }>;
  preview: Array<{
    code: string;
    name: string;
    description?: string | null;
    parent_code?: string | null;
  }>;
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
 * Mapea la respuesta del endpoint GET /types/:typeCode
 * que incluye versión actual e items count.
 */
export function mapCatalogTypeWithVersion(
  api: ApiCatalogTypeWithVersionResponse,
): CatalogTypeWithVersion {
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
    currentVersion: api.current_version
      ? mapCatalogVersion(api.current_version)
      : null,
    itemsCount: api.items_count,
  };
}

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

export function mapCatalogOption(api: ApiCatalogOptionResponse): CatalogOption {
  return {
    code: api.code,
    name: api.name,
    description: api.description,
    parentCode: api.parent_code,
  };
}

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

export function mapCatalogStatistics(
  api: ApiCatalogStatisticsResponse,
): CatalogStatistics {
  return {
    typeCode: api.type_code,
    typeName: api.type_name,
    source: api.source,
    itemCount: api.item_count,
    currentVersion: api.current_version,
  };
}

export function mapCatalogImportResult(
  api: ApiCatalogImportResultResponse,
): CatalogImportResult {
  return {
    success: api.success,
    typeCode: api.type_code,
    version: api.version,
    totalRows: api.total_rows,
    insertedCount: api.inserted_count,
    updatedCount: api.updated_count,
    skippedCount: api.skipped_count,
    errorCount: api.error_count,
    errors: api.errors,
    duration: api.duration,
  };
}

export function mapCatalogValidationResult(
  api: ApiCatalogValidationResultResponse,
): CatalogValidationResult {
  return {
    isValid: api.is_valid,
    totalRows: api.total_rows,
    validRows: api.valid_rows,
    errors: api.errors,
    preview: api.preview.map((p) => ({
      code: p.code,
      name: p.name,
      description: p.description,
      parentCode: p.parent_code,
    })),
  };
}

// ============================================================================
// PUBLIC MAPPERS (for repository)
// ============================================================================

export function mapCatalogTypes(response: {
  data: ApiCatalogTypeResponse[];
}): CatalogType[] {
  return response.data.map(mapCatalogType);
}

export function mapCatalogTypesGrouped(response: {
  data: Record<string, ApiCatalogTypeResponse[]>;
}): Record<string, CatalogType[]> {
  const result: Record<string, CatalogType[]> = {};
  for (const [key, types] of Object.entries(response.data)) {
    result[key] = types.map(mapCatalogType);
  }
  return result;
}

export function mapCatalogStatisticsArray(response: {
  data: ApiCatalogStatisticsResponse[];
}): CatalogStatistics[] {
  return response.data.map(mapCatalogStatistics);
}

export function mapCatalogItems(response: {
  data: ApiCatalogItemResponse[];
}): CatalogItem[] {
  return response.data.map(mapCatalogItem);
}

export function mapCatalogOptions(response: {
  data: ApiCatalogOptionResponse[];
}): CatalogOption[] {
  return response.data.map(mapCatalogOption);
}

export function mapCatalogSearchResult(
  response: ApiCatalogSearchResponse,
): CatalogSearchResult {
  return {
    items: response.data.map(mapCatalogItem),
    total: response.pagination.total,
  };
}

export function mapSingleCatalogItem(response: {
  data: ApiCatalogItemResponse;
}): CatalogItem {
  return mapCatalogItem(response.data);
}

export function mapSingleCatalogVersion(response: {
  data: ApiCatalogVersionResponse | null;
}): CatalogVersion | null {
  return response.data ? mapCatalogVersion(response.data) : null;
}

export function mapCatalogVersions(response: {
  data: ApiCatalogVersionResponse[];
}): CatalogVersion[] {
  return response.data.map(mapCatalogVersion);
}

/**
 * Mapea la respuesta del endpoint GET /types/:typeCode
 */
export function mapSingleCatalogTypeWithVersion(response: {
  data: ApiCatalogTypeWithVersionResponse;
}): CatalogTypeWithVersion {
  return mapCatalogTypeWithVersion(response.data);
}

// ============================================================================
// MAPPERS: Domain → API (for requests)
// ============================================================================

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

export function toApiImportOptions(
  options: CatalogImportOptions,
): Record<string, unknown> {
  return {
    version: options.version,
    source_url: options.sourceUrl ?? null,
    notes: options.notes ?? null,
    skip_errors: options.skipErrors ?? true,
    update_existing: options.updateExisting ?? true,
    deactivate_missing: options.deactivateMissing ?? false,
  };
}

/**
 * Convierte parámetros de búsqueda del dominio al formato de la API (snake_case)
 * ACTUALIZADO: Incluye offset para paginación
 */
export function toApiSearchParams(
  params: CatalogSearchParams,
): Record<string, unknown> {
  const apiParams: Record<string, unknown> = {};

  if (params.query !== undefined && params.query !== "") {
    apiParams.query = params.query;
  }

  if (params.parentCode !== undefined) {
    apiParams.parent_code = params.parentCode;
  }

  if (params.limit !== undefined) {
    apiParams.limit = params.limit;
  }

  // if (params.offset !== undefined && params.offset > 0) {
  if (params.offset !== undefined) {
    apiParams.offset = params.offset;
  }

  return apiParams;
}

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
