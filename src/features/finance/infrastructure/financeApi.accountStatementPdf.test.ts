import { beforeEach, describe, expect, it, vi } from "vitest";

const downloadFile = vi.fn();

vi.mock("@shared/api", () => ({
  apiClient: {
    get: vi.fn(),
    downloadFile: (...args: unknown[]) => downloadFile(...args),
  },
}));

import {
  buildAccountStatementPdfFileName,
  financeApi,
} from "./financeApi";

describe("buildAccountStatementPdfFileName", () => {
  it("normalizes RFC and builds estado-cuenta-{rfc}.pdf", () => {
    expect(buildAccountStatementPdfFileName("  iia040805dz4  ")).toBe(
      "estado-cuenta-IIA040805DZ4.pdf",
    );
  });
});

describe("financeApi.downloadAccountStatementPdf", () => {
  beforeEach(() => {
    downloadFile.mockReset();
    downloadFile.mockResolvedValue(undefined);
  });

  it("calls downloadFile with client_rfc query and sensible filename", async () => {
    await financeApi.downloadAccountStatementPdf({ clientRfc: "iia040805dz4" });

    expect(downloadFile).toHaveBeenCalledTimes(1);
    const [url, filename] = downloadFile.mock.calls[0]!;
    expect(url).toBe(
      "/finance/account-statement/pdf?client_rfc=IIA040805DZ4",
    );
    expect(filename).toBe("estado-cuenta-IIA040805DZ4.pdf");
  });
});

describe("financeApi · Estado de cuenta por client_id", () => {
  beforeEach(() => {
    downloadFile.mockReset();
    downloadFile.mockResolvedValue(undefined);
  });

  it("PDF y CSV usan client_id y nombran el archivo con el cliente", async () => {
    const target = { clientId: "abc-123", clientName: "Agrícola San Isidro" };

    await financeApi.downloadAccountStatementPdf(target);
    await financeApi.downloadAccountStatementCsv(target);

    expect(downloadFile.mock.calls).toEqual([
      [
        "/finance/account-statement/pdf?client_id=abc-123",
        "estado-cuenta-AGRICOLA-SAN-ISIDRO.pdf",
      ],
      [
        "/finance/account-statement/csv?client_id=abc-123",
        "estado-cuenta-AGRICOLA-SAN-ISIDRO.csv",
      ],
    ]);
  });
});
