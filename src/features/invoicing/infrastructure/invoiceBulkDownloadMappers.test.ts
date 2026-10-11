import { describe, expect, it } from "vitest";
import {
  mapInvoiceBulkDownloadJob,
  mapInvoiceBulkDownloadPreview,
  parseContentDispositionFileName,
  type ApiInvoiceBulkDownloadJob,
  type ApiInvoiceBulkDownloadPreview,
} from "./invoiceBulkDownloadMappers";

const rawJob: ApiInvoiceBulkDownloadJob = {
  id: "11111111-1111-4111-8111-111111111111",
  status: "completed_with_errors",
  period_from: "2026-09",
  period_to: "2026-09",
  receiver_rfc: "ABC010101AB1",
  content: "xml_pdf",
  include_payments: true,
  include_cancelled: false,
  invoice_count: 10,
  payment_count: 2,
  files_total: 22,
  files_done: 22,
  warnings_count: 1,
  warnings: [
    {
      uuid: "u1",
      serie_folio: "A1",
      kind: "pdf_missing",
      message: "PDF no disponible",
    },
  ],
  parts: [
    {
      part: 1,
      file_name: "CFDI_X_2026-09_parte-1-de-1.zip",
      bytes: 1000,
      file_count: 22,
    },
  ],
  error_code: null,
  error_message: null,
  created_at: "2026-10-01T00:00:00.000Z",
  started_at: "2026-10-01T00:00:01.000Z",
  completed_at: "2026-10-01T00:01:00.000Z",
  expires_at: "2026-10-08T00:01:00.000Z",
};

describe("mapInvoiceBulkDownloadJob", () => {
  it("mapea snake_case a camelCase", () => {
    const job = mapInvoiceBulkDownloadJob(rawJob);
    expect(job.id).toBe(rawJob.id);
    expect(job.periodFrom).toBe("2026-09");
    expect(job.receiverRfc).toBe("ABC010101AB1");
    expect(job.includePayments).toBe(true);
    expect(job.warnings[0]?.serieFolio).toBe("A1");
    expect(job.parts[0]?.fileName).toContain("CFDI_");
  });
});

describe("mapInvoiceBulkDownloadPreview", () => {
  it("mapea conteos y límites", () => {
    const raw: ApiInvoiceBulkDownloadPreview = {
      invoice_count: 10,
      cancelled_count: 2,
      payment_count: 1,
      files_total: 23,
      exceeds_limit: false,
      limits: { max_months: 12, max_documents: 3000 },
      earliest_allowed_period: "2025-10",
    };
    const preview = mapInvoiceBulkDownloadPreview(raw);
    expect(preview.invoiceCount).toBe(10);
    expect(preview.cancelledCount).toBe(2);
    expect(preview.limits.maxMonths).toBe(12);
    expect(preview.earliestAllowedPeriod).toBe("2025-10");
  });
});

describe("parseContentDispositionFileName", () => {
  it("lee filename* UTF-8", () => {
    expect(
      parseContentDispositionFileName(
        "attachment; filename*=UTF-8''CFDI_ABC_2026-09.zip",
      ),
    ).toBe("CFDI_ABC_2026-09.zip");
  });

  it("lee filename entre comillas", () => {
    expect(
      parseContentDispositionFileName(
        'attachment; filename="CFDI_ABC_2026-09.zip"',
      ),
    ).toBe("CFDI_ABC_2026-09.zip");
  });

  it("null si falta header", () => {
    expect(parseContentDispositionFileName(undefined)).toBeNull();
  });
});
