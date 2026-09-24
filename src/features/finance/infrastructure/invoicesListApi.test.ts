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
    },
  };
});

import { financeInvoicesListApi } from "./invoicesListApi";

describe("financeInvoicesListApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps snake_case pagination to camelCase (total_pages → totalPages)", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "inv-1",
          serie: "A",
          folio: 1,
          receiver_rfc: "XAXX010101000",
          receiver_name: "Cliente Demo",
          issued_at: "2026-07-01T12:00:00.000Z",
          payment_method: "PPD",
          total: 1160,
          balance_due: 1160,
          trip_codes: ["T-001"],
          status: "stamped",
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 44,
        total_pages: 5,
      },
    });

    const result = await financeInvoicesListApi.getAll({ page: 1, limit: 10 });

    expect(getMock).toHaveBeenCalledWith("/invoices?page=1&limit=10");
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 44,
      totalPages: 5,
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: "inv-1",
      receiverRfc: "XAXX010101000",
      status: "stamped",
      totalPaid: 0,
      dispatchSentAt: null,
    });

    // Range formula used by ListingResultsSummary for page 1
    const { page, limit, total } = result.pagination;
    expect(`${(page - 1) * limit + 1}-${Math.min(page * limit, total)}`).toBe(
      "1-10",
    );
  });

  it("maps total_paid when present and falls back to total - balance_due", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "inv-paid",
          serie: "A",
          folio: 2,
          receiver_rfc: "XAXX010101000",
          receiver_name: "Cliente",
          issued_at: "2026-07-01T12:00:00.000Z",
          payment_method: "PPD",
          total: 1160,
          balance_due: 660,
          total_paid: 500,
          trip_codes: [],
          status: "stamped",
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    });

    const result = await financeInvoicesListApi.getAll({ page: 1, limit: 10 });
    expect(result.data[0]?.totalPaid).toBe(500);
  });

  it("maps billing_scope and share_percent when present (ADR-0081)", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "inv-split",
          serie: "A",
          folio: 9,
          receiver_rfc: "AAA010101AAA",
          receiver_name: "Cliente A",
          issued_at: "2026-07-01T12:00:00.000Z",
          payment_method: "PUE",
          total: 6000,
          balance_due: 0,
          trip_codes: ["T-001"],
          status: "stamped",
          billing_scope: "split_share",
          share_percent: 60,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    });

    const result = await financeInvoicesListApi.getAll({ page: 1, limit: 10 });

    expect(result.data[0]).toMatchObject({
      billingScope: "split_share",
      sharePercent: 60,
    });
  });

  it("maps dispatch_sent_at to dispatchSentAt (F4 historial mínimo)", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "inv-sent",
          serie: "A",
          folio: 3,
          receiver_rfc: "XAXX010101000",
          receiver_name: "Cliente",
          issued_at: "2026-07-01T12:00:00.000Z",
          payment_method: "PUE",
          total: 1160,
          balance_due: 0,
          trip_codes: [],
          status: "stamped",
          dispatch_sent_at: "2026-09-11T12:00:00.000Z",
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    });

    const result = await financeInvoicesListApi.getAll({ page: 1, limit: 10 });
    expect(result.data[0]?.dispatchSentAt).toBe("2026-09-11T12:00:00.000Z");
  });

  it("computes last-page range without NaN when totalPages is mapped", async () => {
    getMock.mockResolvedValue({
      data: [],
      pagination: {
        page: 5,
        limit: 10,
        total: 44,
        total_pages: 5,
      },
    });

    const result = await financeInvoicesListApi.getAll({ page: 5, limit: 10 });
    const { page, limit, total, totalPages } = result.pagination;

    expect(totalPages).toBe(5);
    expect(`${(page - 1) * limit + 1}-${Math.min(page * limit, total)}`).toBe(
      "41-44",
    );
  });
});
