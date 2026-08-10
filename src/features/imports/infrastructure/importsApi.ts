/**
 * Imports HTTP client — /api/v1/imports (imports-contract-v1).
 */

import {
  apiClient,
  type ApiSingleResponse,
} from "@shared/api";
import type {
  ImportCommitResult,
  ImportEntityType,
  ImportJob,
  ImportJobErrorItem,
  ImportJobListParams,
  ImportJobsListResult,
  ImportImplementedEntityType,
  ImportOptions,
  ImportPreviewResult,
} from "../domain/entities";
import {
  mapImportCommitResult,
  mapImportJob,
  mapImportJobErrorItem,
  mapImportJobsList,
  mapImportPreviewResult,
  type ApiImportCommitData,
  type ApiImportJob,
  type ApiImportJobErrorItem,
  type ApiImportJobsListResponse,
  type ApiImportPreviewData,
} from "./mappers";

const BASE = "/imports";

export const importsApi = {
  async listJobs(params?: ImportJobListParams): Promise<ImportJobsListResult> {
    const queryParams: Record<string, unknown> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    };
    if (params?.entityType) queryParams.entity_type = params.entityType;
    if (params?.status) queryParams.status = params.status;

    const response = await apiClient.get<ApiImportJobsListResponse>(BASE, {
      params: queryParams,
    });
    return mapImportJobsList(response);
  },

  async getJob(id: string): Promise<ImportJob> {
    const response = await apiClient.get<ApiSingleResponse<ApiImportJob>>(
      `${BASE}/${id}`,
    );
    return mapImportJob(response.data);
  },

  async getJobErrors(id: string): Promise<ImportJobErrorItem[]> {
    const response = await apiClient.get<
      ApiSingleResponse<ApiImportJobErrorItem[]>
    >(`${BASE}/${id}/errors`, {
      params: { format: "json" },
    });
    return (response.data ?? []).map(mapImportJobErrorItem);
  },

  async downloadJobErrors(id: string): Promise<void> {
    const filename = `import-${id}-errors.csv`;
    await apiClient.downloadFile(`${BASE}/${id}/errors`, filename, {
      params: { format: "csv" },
    });
  },

  async downloadTemplate(entityType: ImportEntityType): Promise<void> {
    await apiClient.downloadFile(
      `${BASE}/templates/${entityType}`,
      `${entityType}.csv`,
    );
  },

  async validate(
    entityType: ImportImplementedEntityType,
    file: File,
    options?: Partial<ImportOptions>,
  ): Promise<ImportPreviewResult> {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.updateExisting === false) {
      formData.append("update_existing", "false");
    }
    if (options?.skipErrors === false) {
      formData.append("skip_errors", "false");
    }

    const response = await apiClient.post<
      ApiSingleResponse<ApiImportPreviewData>
    >(`${BASE}/${entityType}/validate`, formData);

    return mapImportPreviewResult(response.data);
  },

  async commit(
    id: string,
    options?: Partial<ImportOptions>,
  ): Promise<ImportCommitResult> {
    const response = await apiClient.post<
      ApiSingleResponse<ApiImportCommitData> & { message?: string }
    >(`${BASE}/${id}/commit`, {
      updateExisting: options?.updateExisting ?? true,
      skipErrors: options?.skipErrors ?? true,
    });
    return mapImportCommitResult(response.data);
  },
};
