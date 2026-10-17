import { describe, expect, it } from "vitest";
import {
  mapDocumentExpiryItem,
  mapDocumentExpiryList,
  type ApiDocumentExpiryItem,
} from "./mappers";

const rawItem: ApiDocumentExpiryItem = {
  entity_type: "vehicle",
  entity_id: "veh-1",
  entity_label: "U-001 · ABC-123",
  doc_type: "insurance",
  expires_on: "2026-11-01",
  days_remaining: 12,
  severity: "warning",
};

describe("mapDocumentExpiryItem", () => {
  it("maps snake_case API item to camelCase domain", () => {
    const item = mapDocumentExpiryItem(rawItem);

    expect(item).toEqual({
      entityType: "vehicle",
      entityId: "veh-1",
      entityLabel: "U-001 · ABC-123",
      docType: "insurance",
      expiresOn: "2026-11-01",
      daysRemaining: 12,
      severity: "warning",
    });
  });

  it("keeps null expires_on and days_remaining", () => {
    const item = mapDocumentExpiryItem({
      ...rawItem,
      entity_type: "driver",
      doc_type: "license",
      expires_on: null,
      days_remaining: null,
      severity: "error",
    });

    expect(item.expiresOn).toBeNull();
    expect(item.daysRemaining).toBeNull();
    expect(item.entityType).toBe("driver");
    expect(item.docType).toBe("license");
  });
});

describe("mapDocumentExpiryList", () => {
  it("maps paginated response including total_pages → totalPages", () => {
    const result = mapDocumentExpiryList({
      data: [rawItem],
      pagination: {
        page: 2,
        limit: 20,
        total: 41,
        total_pages: 3,
      },
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.entityId).toBe("veh-1");
    expect(result.pagination).toEqual({
      page: 2,
      limit: 20,
      total: 41,
      totalPages: 3,
    });
  });
});
