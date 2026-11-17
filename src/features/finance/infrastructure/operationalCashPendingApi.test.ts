import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();

vi.mock("@shared/api", () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
  },
}));

import { operationalCashPendingApi } from "./operationalCashPendingApi";

describe("operationalCashPendingApi.list", () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue({
      data: [],
      meta: {
        totals: { pending_amount: 0, trip_count: 0, client_count: 0 },
        by_client: [],
        eligibility: {
          intent: "sin_cfdi_efectivo",
          pending_gt: 0,
          statuses: ["scheduled", "in_progress", "completed"],
        },
      },
      pagination: { page: 1, limit: 20, total: 0, total_pages: 1 },
    });
  });

  it("sends cobros_bucket when set", async () => {
    await operationalCashPendingApi.list({
      page: 1,
      limit: 20,
      cobrosBucket: "partial",
    });
    expect(getMock).toHaveBeenCalledWith(
      "/trips/operational-cash-pending?page=1&limit=20&cobros_bucket=partial",
    );
  });

  it("omits cobros_bucket when null", async () => {
    await operationalCashPendingApi.list({
      page: 2,
      limit: 10,
      clientId: "client-a",
      cobrosBucket: null,
    });
    expect(getMock).toHaveBeenCalledWith(
      "/trips/operational-cash-pending?page=2&limit=10&client_id=client-a",
    );
  });
});
