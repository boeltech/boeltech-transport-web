import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock("@shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/api")>();
  return {
    ...actual,
    apiClient: {
      get: getMock,
      post: vi.fn(),
      getAxiosInstance: () => ({ post: vi.fn() }),
    },
  };
});

import { fetchBillingDispatchRuns } from "./billingDispatchRunsApi";

describe("fetchBillingDispatchRuns excludeEmptyScheduled", () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
    });
  });

  it("envía exclude_empty_scheduled solo cuando el flag es true", async () => {
    await fetchBillingDispatchRuns({
      page: 1,
      limit: 20,
      excludeEmptyScheduled: true,
    });
    expect(getMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({
          exclude_empty_scheduled: true,
          page: 1,
          limit: 20,
        }),
      }),
    );

    getMock.mockClear();
    await fetchBillingDispatchRuns({
      page: 1,
      limit: 20,
      excludeEmptyScheduled: false,
    });
    const params = getMock.mock.calls[0]?.[1]?.params as Record<string, unknown>;
    expect(params).not.toHaveProperty("exclude_empty_scheduled");
  });
});
