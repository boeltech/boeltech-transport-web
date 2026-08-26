import { beforeEach, describe, expect, it, vi } from "vitest";

const downloadFile = vi.fn();
const get = vi.fn();
const post = vi.fn();

vi.mock("@shared/api", () => ({
  apiClient: {
    downloadFile: (...args: unknown[]) => downloadFile(...args),
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

describe("platformApi reconciliation callers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    downloadFile.mockResolvedValue(undefined);
    get.mockResolvedValue({ data: [] });
    post.mockResolvedValue({
      data: {
        prepaid_remaining: 0,
        prepaid_purchased: 0,
        prepaid_consumed: 0,
        packs: [],
      },
    });
  });

  it("downloadTenantReconciliationCsv always sends period_key", async () => {
    const { platformApi } = await import("./platformApi");

    await platformApi.downloadTenantReconciliationCsv(
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "2026-07",
    );

    expect(downloadFile).toHaveBeenCalledTimes(1);
    const [url, filename, options] = downloadFile.mock.calls[0]!;
    expect(String(url)).toContain("period_key=2026-07");
    expect(String(url)).toContain(
      "tenant_id=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    );
    expect(String(url)).toContain("format=csv");
    expect(filename).toBe("billing-reconciliation-aaaaaaaa-2026-07.csv");
    expect(options).toEqual({ authScope: "platform" });
  });

  it("getTenantReconciliationJson always sends period_key", async () => {
    const { platformApi } = await import("./platformApi");

    await platformApi.getTenantReconciliationJson("tenant-1", "2026-07");

    expect(get).toHaveBeenCalledWith(
      expect.stringContaining("/billing/reconciliation"),
      expect.objectContaining({
        params: expect.objectContaining({
          period_key: "2026-07",
          tenant_id: "tenant-1",
          format: "json",
        }),
        authScope: "platform",
      }),
    );
  });

  it("grantTenantStampPack sends idempotency_key when provided", async () => {
    const { platformApi } = await import("./platformApi");

    await platformApi.grantTenantStampPack("tenant-1", {
      catalogCode: "pack_100",
      notes: null,
      idempotencyKey: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    });

    expect(post).toHaveBeenCalledWith(
      expect.stringContaining("/tenants/tenant-1/stamp-packs"),
      expect.objectContaining({
        catalog_code: "pack_100",
        idempotency_key: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      }),
      expect.objectContaining({ authScope: "platform" }),
    );
  });
});
