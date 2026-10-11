import { describe, expect, it } from "vitest";
import { invoiceBulkDownloadFormSchema } from "./invoiceBulkDownloadSchema";
import { invoiceBulkDownloadCopy } from "../copy/invoiceBulkDownloadCopy";

describe("invoiceBulkDownloadFormSchema", () => {
  it("acepta mes anterior default", () => {
    const result = invoiceBulkDownloadFormSchema.safeParse({
      periodPreset: "previous",
      periodFrom: "2026-09",
      periodTo: "2026-09",
      content: "xml_pdf",
      includePayments: true,
      includeCancelled: false,
    });
    expect(result.success).toBe(true);
  });

  it("rechaza rango > 12 meses", () => {
    const result = invoiceBulkDownloadFormSchema.safeParse({
      periodPreset: "custom",
      periodFrom: "2025-01",
      periodTo: "2026-02",
      content: "xml",
      includePayments: true,
      includeCancelled: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === invoiceBulkDownloadCopy.period.maxRange)).toBe(
        true,
      );
    }
  });

  it("rechaza periodo invertido", () => {
    const result = invoiceBulkDownloadFormSchema.safeParse({
      periodPreset: "custom",
      periodFrom: "2026-09",
      periodTo: "2026-08",
      content: "xml_pdf",
      includePayments: true,
      includeCancelled: false,
    });
    expect(result.success).toBe(false);
  });
});
