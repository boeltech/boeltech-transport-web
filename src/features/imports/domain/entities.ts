/**
 * Tenant master CSV imports — domain types (ADR-0074 / imports-contract-v1).
 */

// ── Entity types ───────────────────────────────────────────────────────────

export const IMPORT_ENTITY_TYPES = [
  "clients",
  "addresses",
  "employees",
  "vehicles",
  "drivers",
] as const;

export type ImportEntityType = (typeof IMPORT_ENTITY_TYPES)[number];

export const IMPORT_OLA_A_ENTITY_TYPES = ["clients", "addresses"] as const;

export type ImportOlaAEntityType = (typeof IMPORT_OLA_A_ENTITY_TYPES)[number];

export const IMPORT_OLA_B_ENTITY_TYPES = [
  "employees",
  "vehicles",
  "drivers",
] as const;

export type ImportOlaBEntityType = (typeof IMPORT_OLA_B_ENTITY_TYPES)[number];

/** Tipos con perfil runtime (wizard/validate/commit). Hoy = A ∪ B. */
export const IMPORT_IMPLEMENTED_ENTITY_TYPES = IMPORT_ENTITY_TYPES;

export type ImportImplementedEntityType =
  (typeof IMPORT_IMPLEMENTED_ENTITY_TYPES)[number];

export const IMPORT_ENTITY_TYPE_LABELS: Record<ImportEntityType, string> = {
  clients: "Clientes",
  addresses: "Direcciones",
  employees: "Empleados",
  vehicles: "Vehículos",
  drivers: "Conductores",
};

// ── Job status ─────────────────────────────────────────────────────────────

export const IMPORT_JOB_STATUSES = [
  "uploaded",
  "validated",
  "committed",
  "failed",
  "cancelled",
] as const;

export type ImportJobStatus = (typeof IMPORT_JOB_STATUSES)[number];

export const IMPORT_JOB_STATUS_LABELS: Record<ImportJobStatus, string> = {
  uploaded: "Recibido",
  validated: "Revisado",
  committed: "Completado",
  failed: "Fallida",
  cancelled: "Cancelada",
};

// ── Row action ─────────────────────────────────────────────────────────────

export type ImportRowAction = "insert" | "update" | "skip";

// ── Options ────────────────────────────────────────────────────────────────

export interface ImportOptions {
  updateExisting: boolean;
  skipErrors: boolean;
}

export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  updateExisting: true,
  skipErrors: true,
};

// ── Job ────────────────────────────────────────────────────────────────────

export interface ImportJob {
  id: string;
  tenantId: string;
  entityType: ImportEntityType;
  status: ImportJobStatus;
  originalFilename: string | null;
  fileSha256: string | null;
  rowCount: number;
  validCount: number;
  errorCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  options: ImportOptions;
  errorSummary: { sampleCodes?: string[] } | null;
  createdBy: string | null;
  validatedAt: string | null;
  committedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  isValid: boolean;
  action: ImportRowAction | null;
  naturalKey: string | null;
  data: Record<string, unknown> | null;
}

export interface ImportJobErrorItem {
  rowNumber: number;
  codes: string[];
  messages: string[];
  fields: string[];
  raw?: Record<string, unknown> | null;
}

export interface ImportPreviewResult extends ImportJob {
  previewRows: ImportPreviewRow[];
  errors: ImportJobErrorItem[];
  optionsDefaults: ImportOptions;
}

export interface ImportCommitResult {
  id: string;
  status: ImportJobStatus;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  durationMs: number;
}

export interface ImportJobListParams {
  entityType?: ImportEntityType;
  status?: ImportJobStatus;
  page?: number;
  limit?: number;
}

export interface ImportJobsListResult {
  data: ImportJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Query keys ─────────────────────────────────────────────────────────────

export const importQueryKeys = {
  all: ["imports"] as const,
  lists: () => [...importQueryKeys.all, "list"] as const,
  list: (params?: ImportJobListParams) =>
    [...importQueryKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...importQueryKeys.all, "detail", id] as const,
  errors: (id: string) => [...importQueryKeys.all, "errors", id] as const,
} as const;
