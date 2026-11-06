import { beforeEach, describe, expect, it, vi } from "vitest";

const downloadFile = vi.fn();
const get = vi.fn();

vi.mock("@shared/api", () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    downloadFile: (...args: unknown[]) => downloadFile(...args),
  },
}));

import { buildPendingRelationFileName, financeApi } from "./financeApi";

describe("buildPendingRelationFileName", () => {
  it("builds relacion-pendientes-{RFC}-{generatedOn}.{format}", () => {
    expect(
      buildPendingRelationFileName(
        "  iia040805dz4  ",
        "2026-11-06",
        "csv",
      ),
    ).toBe("relacion-pendientes-IIA040805DZ4-2026-11-06.csv");
  });
});

describe("financeApi pending relation", () => {
  beforeEach(() => {
    get.mockReset();
    downloadFile.mockReset();
    downloadFile.mockResolvedValue(undefined);
  });

  it("loads format=count and does not call downloadFile", async () => {
    get.mockResolvedValue({
      data: { invoice_count: 3, generated_on: "2026-11-06" },
    });

    const count = await financeApi.getPendingRelationCount("iia040805dz4");

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(
      "/finance/pending-relation?client_rfc=IIA040805DZ4&format=count",
    );
    expect(downloadFile).not.toHaveBeenCalled();
    expect(count).toEqual({
      invoiceCount: 3,
      generatedOn: "2026-11-06",
    });
  });

  it("downloads csv with format=csv and the generated_on filename", async () => {
    await financeApi.downloadPendingRelation(
      "iia040805dz4",
      "csv",
      "2026-11-06",
    );

    expect(downloadFile).toHaveBeenCalledTimes(1);
    const [url, filename] = downloadFile.mock.calls[0] as [string, string];
    expect(url).toBe(
      "/finance/pending-relation?client_rfc=IIA040805DZ4&format=csv",
    );
    expect(filename).toBe("relacion-pendientes-IIA040805DZ4-2026-11-06.csv");
    expect(get).not.toHaveBeenCalled();
  });
});
