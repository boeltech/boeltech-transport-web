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
    });

    // Range formula used by ListingResultsSummary for page 1
    const { page, limit, total } = result.pagination;
    expect(`${(page - 1) * limit + 1}-${Math.min(page * limit, total)}`).toBe(
      "1-10",
    );
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
