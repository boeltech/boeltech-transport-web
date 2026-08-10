/**
 * Catalog import/validate mappers — snake_case API → camelCase domain (Fase 3).
 */

import { describe, expect, it } from "vitest";
import {
  mapCatalogImportResult,
  mapCatalogValidationResult,
  type ApiCatalogImportResultResponse,
  type ApiCatalogValidationResultResponse,
} from "./mappers";

describe("mapCatalogValidationResult", () => {
  it("maps estimated_deactivate_count and optional detection fields", () => {
    const api: ApiCatalogValidationResultResponse = {
      is_valid: true,
      total_rows: 10,
      valid_rows: 10,
      errors: [],
      preview: [
        {
          code: "01",
          name: "Aguascalientes",
          description: null,
          parent_code: null,
        },
      ],
      estimated_deactivate_count: 2,
      detected_profile: "sat_estado",
      detected_delimiter: ";",
    };

    const result = mapCatalogValidationResult(api);

    expect(result.isValid).toBe(true);
    expect(result.estimatedDeactivateCount).toBe(2);
    expect(result.detectedProfile).toBe("sat_estado");
    expect(result.detectedDelimiter).toBe(";");
    expect(result.preview[0]?.parentCode).toBeNull();
  });

  it("omits optional fields when API does not send them", () => {
    const result = mapCatalogValidationResult({
      is_valid: false,
      total_rows: 1,
      valid_rows: 0,
      errors: [{ row: 1, errors: ["MISSING_CODE"] }],
      preview: [],
    });

    expect(result.estimatedDeactivateCount).toBeUndefined();
    expect(result.detectedProfile).toBeUndefined();
    expect(result.detectedDelimiter).toBeUndefined();
  });
});

describe("mapCatalogImportResult", () => {
  it("maps deactivated_count and duration_ms", () => {
    const api: ApiCatalogImportResultResponse = {
      success: true,
      type_code: "sat_forma_pago",
      version: "1.0.20260808",
      total_rows: 5,
      inserted_count: 2,
      updated_count: 3,
      skipped_count: 0,
      error_count: 0,
      deactivated_count: 4,
      errors: [],
      duration_ms: 340,
    };

    const result = mapCatalogImportResult(api);

    expect(result.typeCode).toBe("sat_forma_pago");
    expect(result.deactivatedCount).toBe(4);
    expect(result.duration).toBe(340);
  });

  it("falls back to legacy duration when duration_ms is absent", () => {
    const result = mapCatalogImportResult({
      success: true,
      type_code: "sat_estado",
      version: "1.0.20260808",
      total_rows: 1,
      inserted_count: 1,
      updated_count: 0,
      skipped_count: 0,
      error_count: 0,
      errors: [],
      duration: 99,
    });

    expect(result.duration).toBe(99);
    expect(result.deactivatedCount).toBeUndefined();
  });
});
