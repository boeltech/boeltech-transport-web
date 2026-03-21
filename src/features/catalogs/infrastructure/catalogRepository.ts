/**
 * Catalog Repository Implementation
 * Clean Architecture - Infrastructure Layer
 *
 * Implementa la interfaz ICatalogRepository usando HTTP/REST.
 * Esta es la capa que conoce los detalles de implementación (axios, URLs, etc.)
 */

import { apiClient, type MappedSingleResult } from "@shared/api";
import type {
  CatalogType,
  CatalogItem,
  CatalogOption,
  CatalogVersion,
  CatalogTypeCodeValue,
  CatalogSearchParams,
  CatalogFilterParams,
} from "../domain/entities";
import type {
  ICatalogRepository,
  CreateCatalogItemDTO,
  UpdateCatalogItemDTO,
  CatalogSearchResult,
} from "../domain/repository";
import {
  mapCatalogTypes,
  mapCatalogItems,
  mapCatalogOptions,
  mapCatalogSearchResult,
  mapSingleCatalogItem,
  mapSingleCatalogVersion,
  toApiCreateCatalogItem,
  toApiUpdateCatalogItem,
  toApiSearchParams,
  toApiFilterParams,
  type ApiCatalogTypeResponse,
  type ApiCatalogItemResponse,
  type ApiCatalogOptionResponse,
  type ApiCatalogSearchResponse,
  type ApiCatalogVersionResponse,
} from "./mappers";

// ============================================================================
// CONSTANTS
// ============================================================================

const CATALOGS_ENDPOINT = "/catalogs";

// ============================================================================
// CATALOG REPOSITORY IMPLEMENTATION
// ============================================================================

export class CatalogRepository implements ICatalogRepository {
  // ─────────────────────────────────────────────────────────────────────────
  // Catalog Types
  // ─────────────────────────────────────────────────────────────────────────

  async findTypes(): Promise<CatalogType[]> {
    const response = await apiClient.get<{ data: ApiCatalogTypeResponse[] }>(
      `${CATALOGS_ENDPOINT}/types`,
    );
    return mapCatalogTypes(response);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Catalog Items - Read
  // ─────────────────────────────────────────────────────────────────────────

  async findAll(
    typeCode: CatalogTypeCodeValue,
    filters?: CatalogFilterParams,
  ): Promise<CatalogItem[]> {
    const response = await apiClient.get<{ data: ApiCatalogItemResponse[] }>(
      `${CATALOGS_ENDPOINT}/${typeCode}`,
      { params: toApiFilterParams(filters) },
    );
    return mapCatalogItems(response);
  }

  async findAllAsOptions(
    typeCode: CatalogTypeCodeValue,
    parentCode?: string,
  ): Promise<CatalogOption[]> {
    const params = parentCode ? { parent_code: parentCode } : {};
    const response = await apiClient.get<{ data: ApiCatalogOptionResponse[] }>(
      `${CATALOGS_ENDPOINT}/${typeCode}/options`,
      { params },
    );
    return mapCatalogOptions(response);
  }

  async findByCode(
    typeCode: CatalogTypeCodeValue,
    code: string,
  ): Promise<CatalogItem | null> {
    try {
      const response = await apiClient.get<{ data: ApiCatalogItemResponse }>(
        `${CATALOGS_ENDPOINT}/${typeCode}/${code}`,
      );
      return mapSingleCatalogItem(response);
    } catch (error: unknown) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async findChildren(
    typeCode: CatalogTypeCodeValue,
    parentCode: string,
  ): Promise<CatalogItem[]> {
    const response = await apiClient.get<{ data: ApiCatalogItemResponse[] }>(
      `${CATALOGS_ENDPOINT}/${typeCode}/${parentCode}/children`,
    );
    return mapCatalogItems(response);
  }

  async search(
    typeCode: CatalogTypeCodeValue,
    params: CatalogSearchParams,
  ): Promise<CatalogSearchResult> {
    const response = await apiClient.get<ApiCatalogSearchResponse>(
      `${CATALOGS_ENDPOINT}/${typeCode}/search`,
      { params: toApiSearchParams(params) },
    );
    return mapCatalogSearchResult(response);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Catalog Items - Write
  // ─────────────────────────────────────────────────────────────────────────

  async create(
    typeCode: CatalogTypeCodeValue,
    data: CreateCatalogItemDTO,
  ): Promise<MappedSingleResult<CatalogItem>> {
    const apiData = toApiCreateCatalogItem(data);
    const response = await apiClient.post<{
      data: ApiCatalogItemResponse;
      message?: string;
    }>(`${CATALOGS_ENDPOINT}/${typeCode}`, apiData);

    return {
      data: mapSingleCatalogItem({ data: response.data }),
      message: response.message,
    };
  }

  async update(
    typeCode: CatalogTypeCodeValue,
    code: string,
    data: UpdateCatalogItemDTO,
  ): Promise<MappedSingleResult<CatalogItem>> {
    const apiData = toApiUpdateCatalogItem(data);
    const response = await apiClient.put<{
      data: ApiCatalogItemResponse;
      message?: string;
    }>(`${CATALOGS_ENDPOINT}/${typeCode}/${code}`, apiData);

    return {
      data: mapSingleCatalogItem({ data: response.data }),
      message: response.message,
    };
  }

  async delete(typeCode: CatalogTypeCodeValue, code: string): Promise<void> {
    await apiClient.delete(`${CATALOGS_ENDPOINT}/${typeCode}/${code}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Versions
  // ─────────────────────────────────────────────────────────────────────────

  async findCurrentVersion(
    typeCode: CatalogTypeCodeValue,
  ): Promise<CatalogVersion | null> {
    try {
      const response = await apiClient.get<{
        data: ApiCatalogVersionResponse | null;
      }>(`${CATALOGS_ENDPOINT}/${typeCode}/version`);
      return mapSingleCatalogVersion(response);
    } catch (error: unknown) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Utility
  // ─────────────────────────────────────────────────────────────────────────

  async count(typeCode: CatalogTypeCodeValue): Promise<number> {
    const response = await apiClient.get<{ data: { count: number } }>(
      `${CATALOGS_ENDPOINT}/${typeCode}/count`,
    );
    return response.data.count;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private
  // ─────────────────────────────────────────────────────────────────────────

  private isNotFoundError(error: unknown): boolean {
    if (error && typeof error === "object") {
      const axiosError = error as { response?: { status?: number } };
      return axiosError.response?.status === 404;
    }
    return false;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Crea una instancia del repositorio de catálogos
 */
export function createCatalogRepository(): ICatalogRepository {
  return new CatalogRepository();
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Instancia singleton del repositorio
 */
export const catalogRepository = new CatalogRepository();
