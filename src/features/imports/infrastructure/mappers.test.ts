import { describe, expect, it } from "vitest";
import {
  mapImportCommitResult,
  mapImportJob,
  mapImportJobsList,
  mapImportPreviewResult,
  type ApiImportJob,
  type ApiImportPreviewData,
} from "./mappers";

const rawJob: ApiImportJob = {
  id: "job-1",
  tenant_id: "tenant-1",
  entity_type: "clients",
  status: "validated",
  original_filename: "clients.csv",
  file_sha256: "abc123",
  row_count: 10,
  valid_count: 8,
  error_count: 2,
  inserted_count: 0,
  updated_count: 0,
  skipped_count: 0,
  options: { update_existing: true, skip_errors: false },
  error_summary: { sample_codes: ["INVALID_RFC"] },
  created_by: "user-1",
  validated_at: "2026-08-08T12:00:00.000Z",
  committed_at: null,
  created_at: "2026-08-08T11:00:00.000Z",
  updated_at: "2026-08-08T12:00:00.000Z",
};

describe("mapImportJob", () => {
  it("maps snake_case job fields to camelCase", () => {
    const job = mapImportJob(rawJob);

    expect(job.id).toBe("job-1");
    expect(job.tenantId).toBe("tenant-1");
    expect(job.entityType).toBe("clients");
    expect(job.status).toBe("validated");
    expect(job.originalFilename).toBe("clients.csv");
    expect(job.fileSha256).toBe("abc123");
    expect(job.rowCount).toBe(10);
    expect(job.validCount).toBe(8);
    expect(job.errorCount).toBe(2);
    expect(job.options.updateExisting).toBe(true);
    expect(job.options.skipErrors).toBe(false);
    expect(job.errorSummary?.sampleCodes).toEqual(["INVALID_RFC"]);
    expect(job.createdBy).toBe("user-1");
    expect(job.validatedAt).toBe("2026-08-08T12:00:00.000Z");
    expect(job.committedAt).toBeNull();
    expect(job.createdAt).toBe("2026-08-08T11:00:00.000Z");
  });
});

describe("mapImportPreviewResult", () => {
  it("maps preview rows, errors and options defaults", () => {
    const raw: ApiImportPreviewData = {
      ...rawJob,
      preview_rows: [
        {
          row_number: 2,
          is_valid: true,
          action: "insert",
          natural_key: "XAXX010101000",
          data: { tax_id: "XAXX010101000" },
        },
      ],
      errors: [
        {
          row_number: 3,
          codes: ["INVALID_RFC"],
          messages: ["RFC inválido"],
          fields: ["tax_id"],
        },
      ],
      options_defaults: { update_existing: true, skip_errors: true },
    };

    const preview = mapImportPreviewResult(raw);

    expect(preview.previewRows).toHaveLength(1);
    expect(preview.previewRows[0]?.rowNumber).toBe(2);
    expect(preview.previewRows[0]?.isValid).toBe(true);
    expect(preview.previewRows[0]?.naturalKey).toBe("XAXX010101000");
    expect(preview.errors[0]?.rowNumber).toBe(3);
    expect(preview.errors[0]?.codes).toEqual(["INVALID_RFC"]);
    expect(preview.optionsDefaults.updateExisting).toBe(true);
    expect(preview.optionsDefaults.skipErrors).toBe(true);
  });
});

describe("mapImportCommitResult", () => {
  it("maps commit counters and duration", () => {
    const result = mapImportCommitResult({
      id: "job-1",
      status: "committed",
      inserted_count: 5,
      updated_count: 3,
      skipped_count: 1,
      error_count: 1,
      duration_ms: 1234,
    });

    expect(result.status).toBe("committed");
    expect(result.insertedCount).toBe(5);
    expect(result.updatedCount).toBe(3);
    expect(result.skippedCount).toBe(1);
    expect(result.errorCount).toBe(1);
    expect(result.durationMs).toBe(1234);
  });
});

describe("mapImportJobsList", () => {
  it("maps pagination total_pages to totalPages", () => {
    const mapped = mapImportJobsList({
      data: [rawJob],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    });

    expect(mapped.data).toHaveLength(1);
    expect(mapped.pagination.totalPages).toBe(1);
    expect(mapped.pagination.limit).toBe(20);
  });
});
