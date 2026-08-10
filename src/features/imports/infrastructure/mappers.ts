/**
 * Imports API mappers — snake_case raw → camelCase domain.
 */

import type {
  ImportCommitResult,
  ImportEntityType,
  ImportJob,
  ImportJobErrorItem,
  ImportJobStatus,
  ImportJobsListResult,
  ImportOptions,
  ImportPreviewResult,
  ImportPreviewRow,
  ImportRowAction,
} from "../domain/entities";

// ── Raw types (API snake_case) ─────────────────────────────────────────────

export interface ApiImportOptions {
  update_existing: boolean;
  skip_errors: boolean;
}

export interface ApiImportJob {
  id: string;
  tenant_id: string;
  entity_type: string;
  status: string;
  original_filename: string | null;
  file_sha256: string | null;
  row_count: number;
  valid_count: number;
  error_count: number;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  options: ApiImportOptions;
  error_summary: { sample_codes?: string[] } | null;
  created_by: string | null;
  validated_at: string | null;
  committed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiImportPreviewRow {
  row_number: number;
  is_valid: boolean;
  action: string | null;
  natural_key: string | null;
  data: Record<string, unknown> | null;
}

export interface ApiImportJobErrorItem {
  row_number: number;
  codes: string[];
  messages: string[];
  fields: string[];
  raw?: Record<string, unknown> | null;
}

export interface ApiImportPreviewData extends ApiImportJob {
  preview_rows: ApiImportPreviewRow[];
  errors: ApiImportJobErrorItem[];
  options_defaults: ApiImportOptions;
}

export interface ApiImportCommitData {
  id: string;
  status: string;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  duration_ms: number;
}

export interface ApiImportJobsListResponse {
  data: ApiImportJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ── Mappers ────────────────────────────────────────────────────────────────

export function mapImportOptions(raw: ApiImportOptions): ImportOptions {
  return {
    updateExisting: Boolean(raw.update_existing),
    skipErrors: Boolean(raw.skip_errors),
  };
}

function mapErrorSummary(
  raw: ApiImportJob["error_summary"],
): ImportJob["errorSummary"] {
  if (!raw) return null;
  return {
    sampleCodes: raw.sample_codes,
  };
}

export function mapImportJob(raw: ApiImportJob): ImportJob {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    entityType: raw.entity_type as ImportEntityType,
    status: raw.status as ImportJobStatus,
    originalFilename: raw.original_filename,
    fileSha256: raw.file_sha256,
    rowCount: raw.row_count,
    validCount: raw.valid_count,
    errorCount: raw.error_count,
    insertedCount: raw.inserted_count,
    updatedCount: raw.updated_count,
    skippedCount: raw.skipped_count,
    options: mapImportOptions(raw.options),
    errorSummary: mapErrorSummary(raw.error_summary),
    createdBy: raw.created_by,
    validatedAt: raw.validated_at,
    committedAt: raw.committed_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function mapImportPreviewRow(raw: ApiImportPreviewRow): ImportPreviewRow {
  return {
    rowNumber: raw.row_number,
    isValid: raw.is_valid,
    action: (raw.action as ImportRowAction | null) ?? null,
    naturalKey: raw.natural_key,
    data: raw.data,
  };
}

export function mapImportJobErrorItem(
  raw: ApiImportJobErrorItem,
): ImportJobErrorItem {
  return {
    rowNumber: raw.row_number,
    codes: raw.codes ?? [],
    messages: raw.messages ?? [],
    fields: raw.fields ?? [],
    raw: raw.raw ?? null,
  };
}

export function mapImportPreviewResult(
  raw: ApiImportPreviewData,
): ImportPreviewResult {
  return {
    ...mapImportJob(raw),
    previewRows: (raw.preview_rows ?? []).map(mapImportPreviewRow),
    errors: (raw.errors ?? []).map(mapImportJobErrorItem),
    optionsDefaults: mapImportOptions(raw.options_defaults),
  };
}

export function mapImportCommitResult(
  raw: ApiImportCommitData,
): ImportCommitResult {
  return {
    id: raw.id,
    status: raw.status as ImportJobStatus,
    insertedCount: raw.inserted_count,
    updatedCount: raw.updated_count,
    skippedCount: raw.skipped_count,
    errorCount: raw.error_count,
    durationMs: raw.duration_ms,
  };
}

export function mapImportJobsList(
  response: ApiImportJobsListResponse,
): ImportJobsListResult {
  return {
    data: response.data.map(mapImportJob),
    pagination: {
      page: response.pagination.page,
      limit: response.pagination.limit,
      total: response.pagination.total,
      totalPages: response.pagination.total_pages,
    },
  };
}
