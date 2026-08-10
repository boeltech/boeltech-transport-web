/**
 * Catalog Repository Implementation
 * Clean Architecture - Infrastructure Layer
 *
 * Implementa la interfaz ICatalogRepository usando HTTP/REST.
 *
 * ACTUALIZADO: findTypeByCode usa mapCatalogTypeWithVersion correctamente
 */

import { apiClient, type MappedSingleResult } from "@shared/api";
import type { AxiosRequestConfig } from "axios";
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
  CatalogTypeWithVersion,
} from "../domain";
import type {
  ICatalogRepository,
  CreateCatalogItemDTO,
  UpdateCatalogItemDTO,
  CatalogSearchResult,
} from "../domain/repository";
import {
  mapCatalogTypes,
  mapCatalogTypesGrouped,
  mapCatalogStatisticsArray,
  mapCatalogItems,
  mapCatalogOptions,
  mapCatalogSearchResult,
  mapSingleCatalogItem,
  mapSingleCatalogVersion,
  mapCatalogVersions,
  mapCatalogImportResult,
  mapCatalogValidationResult,
  mapSingleCatalogTypeWithVersion,
  toApiCreateCatalogItem,
  toApiUpdateCatalogItem,
  toApiImportOptions,
  toApiSearchParams,
  toApiFilterParams,
  type ApiCatalogTypeResponse,
  type ApiCatalogTypeWithVersionResponse,
  type ApiCatalogItemResponse,
  type ApiCatalogOptionResponse,
  type ApiCatalogSearchResponse,
  type ApiCatalogVersionResponse,
  type ApiCatalogStatisticsResponse,
  type ApiCatalogImportResultResponse,
  type ApiCatalogValidationResultResponse,
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

  async findTypes(
    requestConfig?: AxiosRequestConfig,
  ): Promise<CatalogType[]> {
    const response = await apiClient.get<{ data: ApiCatalogTypeResponse[] }>(
      `${CATALOGS_ENDPOINT}/types`,
      requestConfig,
    );
    return mapCatalogTypes(response);
  }

  async findTypesGrouped(
    requestConfig?: AxiosRequestConfig,
  ): Promise<Record<string, CatalogType[]>> {
    const response = await apiClient.get<{
      data: Record<string, ApiCatalogTypeResponse[]>;
    }>(`${CATALOGS_ENDPOINT}/types/grouped`, requestConfig);
    return mapCatalogTypesGrouped(response);
  }

  /**
   * Obtiene un tipo de catálogo específico con su versión actual e items count.
   * Útil para el wizard de importación.
   *
   * @param typeCode - Código del tipo de catálogo (ej: "sat_municipio")
   * @returns Tipo de catálogo con versión actual o null si no existe
   */
  async findTypeByCode(
    typeCode: string,
    requestConfig?: AxiosRequestConfig,
  ): Promise<CatalogTypeWithVersion | null> {
    try {
      const response = await apiClient.get<{
        data: ApiCatalogTypeWithVersionResponse;
      }>(`${CATALOGS_ENDPOINT}/types/${typeCode}`, requestConfig);

      return mapSingleCatalogTypeWithVersion(response);
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Statistics
  // ─────────────────────────────────────────────────────────────────────────

  async getStatistics(
    requestConfig?: AxiosRequestConfig,
  ): Promise<CatalogStatistics[]> {
    const response = await apiClient.get<{
      data: ApiCatalogStatisticsResponse[];
    }>(`${CATALOGS_ENDPOINT}/statistics`, requestConfig);
    return mapCatalogStatisticsArray(response);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Catalog Items - Read
  // ─────────────────────────────────────────────────────────────────────────

  async findAll(
    typeCode: string,
    filters?: CatalogFilterParams,
  ): Promise<CatalogItem[]> {
    const response = await apiClient.get<{ data: ApiCatalogItemResponse[] }>(
      `${CATALOGS_ENDPOINT}/${typeCode}`,
      { params: toApiFilterParams(filters) },
    );
    return mapCatalogItems(response);
  }

  async findAllAsOptions(
    typeCode: string,
    parentCode?: string,
  ): Promise<CatalogOption[]> {
    const params = parentCode ? { parent_code: parentCode } : {};
    const response = await apiClient.get<{ data: ApiCatalogOptionResponse[] }>(
      `${CATALOGS_ENDPOINT}/${typeCode}/options`,
      { params },
    );
    return mapCatalogOptions(response);
  }

  async search(
    typeCode: string,
    params: CatalogSearchParams,
  ): Promise<CatalogSearchResult> {
    const response = await apiClient.get<ApiCatalogSearchResponse>(
      `${CATALOGS_ENDPOINT}/${typeCode}/search`,
      { params: toApiSearchParams(params) },
    );
    return mapCatalogSearchResult(response);
  }

  async findByCode(
    typeCode: string,
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
    typeCode: string,
    parentCode: string,
  ): Promise<CatalogItem[]> {
    const response = await apiClient.get<{ data: ApiCatalogItemResponse[] }>(
      `${CATALOGS_ENDPOINT}/${typeCode}/${parentCode}/children`,
    );
    return mapCatalogItems(response);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Catalog Items - Write
  // ─────────────────────────────────────────────────────────────────────────

  async create(
    typeCode: string,
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
    typeCode: string,
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

  async delete(typeCode: string, code: string): Promise<void> {
    await apiClient.delete(`${CATALOGS_ENDPOINT}/${typeCode}/${code}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Import
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Catálogos SAT grandes (p. ej. sat_colonia ~145k) superan el timeout global
   * de Axios (30s). Validate/import usan 5 min; el caller puede sobreescribir.
   */
  private static readonly IMPORT_HTTP_TIMEOUT_MS = 300_000;

  private mergeImportRequestConfig(
    requestConfig?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    return {
      timeout: CatalogRepository.IMPORT_HTTP_TIMEOUT_MS,
      ...requestConfig,
    };
  }

  async importCatalog(
    typeCode: string,
    file: File,
    options: CatalogImportOptions,
    requestConfig?: AxiosRequestConfig,
  ): Promise<CatalogImportResult> {
    const formData = new FormData();
    formData.append("file", file);

    // Append options as form fields
    const apiOptions = toApiImportOptions(options);
    for (const [key, value] of Object.entries(apiOptions)) {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    }

    const response = await apiClient.post<{
      data: ApiCatalogImportResultResponse;
      message?: string;
    }>(
      `${CATALOGS_ENDPOINT}/${typeCode}/import`,
      formData,
      this.mergeImportRequestConfig(requestConfig),
    );

    return mapCatalogImportResult(response.data);
  }

  async validateImport(
    typeCode: string,
    file: File,
    requestConfig?: AxiosRequestConfig,
  ): Promise<CatalogValidationResult> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<{
      data: ApiCatalogValidationResultResponse;
      message?: string;
    }>(
      `${CATALOGS_ENDPOINT}/${typeCode}/import/validate`,
      formData,
      this.mergeImportRequestConfig(requestConfig),
    );

    return mapCatalogValidationResult(response.data);
  }

  /**
   * Descarga CSV plantilla SAT para el tipo (GET …/import/template).
   * Usar `authScope: "platform"` desde el hub Platform.
   */
  async downloadTemplate(
    typeCode: string,
    requestConfig?: AxiosRequestConfig,
  ): Promise<void> {
    const filename = `${typeCode}-template-v1.csv`;
    await apiClient.downloadFile(
      `${CATALOGS_ENDPOINT}/${typeCode}/import/template`,
      filename,
      requestConfig,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Versions
  // ─────────────────────────────────────────────────────────────────────────

  async findCurrentVersion(typeCode: string): Promise<CatalogVersion | null> {
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

  async findVersions(typeCode: string): Promise<CatalogVersion[]> {
    const response = await apiClient.get<{ data: ApiCatalogVersionResponse[] }>(
      `${CATALOGS_ENDPOINT}/${typeCode}/versions`,
    );
    return mapCatalogVersions(response);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Utility
  // ─────────────────────────────────────────────────────────────────────────

  async count(typeCode: string): Promise<number> {
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
// SINGLETON INSTANCE
// ============================================================================

export const catalogRepository = new CatalogRepository();
