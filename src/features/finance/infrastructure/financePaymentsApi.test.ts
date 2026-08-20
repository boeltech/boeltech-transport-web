import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  financePaymentsApi,
  mapOpenPpdPagination,
  mapRepExceptionItem,
} from "./financePaymentsApi";

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

describe("mapOpenPpdPagination", () => {
  it("maps total_pages to totalPages", () => {
    expect(
      mapOpenPpdPagination({
        page: 2,
        limit: 50,
        total: 80,
        total_pages: 2,
      }),
    ).toEqual({
      page: 2,
      limit: 50,
      total: 80,
      totalPages: 2,
    });
  });

  it("accepts camelCase totalPages from interceptors", () => {
    expect(
      mapOpenPpdPagination({
        page: 1,
        limit: 50,
        total: 12,
        totalPages: 1,
      }),
    ).toEqual({
      page: 1,
      limit: 50,
      total: 12,
      totalPages: 1,
    });
  });
});

describe("financePaymentsApi.getOpenPpdInvoices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes page and limit and maps pagination", async () => {
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
        limit: 50,
        total: 51,
        total_pages: 2,
      },
    });

    const result = await financePaymentsApi.getOpenPpdInvoices(
      "XAXX010101000",
      1,
      50,
    );

    expect(getMock).toHaveBeenCalledWith(
      "/finance/open-ppd-invoices?receiver_rfc=XAXX010101000&page=1&limit=50",
    );
    expect(result.pagination).toEqual({
      page: 1,
      limit: 50,
      total: 51,
      totalPages: 2,
    });
    expect(result.data[0]?.receiverRfc).toBe("XAXX010101000");
  });
});

describe("mapRepExceptionItem / getRepExceptions", () => {
  it("maps snake_case allocations and deadline without using invoice_id as Pagado", () => {
    const item = mapRepExceptionItem({
      payment_id: "pay-1",
      payment_date: "2026-06-08",
      amount: 1500,
      amount_mxn: 1500,
      payment_form: "03",
      receiver_rfc: "XAXX010101000",
      receiver_name: "Cliente Demo",
      rep_status: "failed",
      rep_cfdi_uuid: null,
      rep_last_error: "PAC timeout",
      allocations: [
        {
          ingress_invoice_id: "inv-2",
          amount: 1500,
          serie: "A",
          folio: 21,
        },
      ],
      deadline_date: "2026-07-05",
      deadline_status: "overdue",
      days_until_deadline: -13,
    });
    expect(item.paymentId).toBe("pay-1");
    expect(item.repStatus).toBe("failed");
    expect(item.deadlineStatus).toBe("overdue");
    expect(item.allocations[0]?.ingressInvoiceId).toBe("inv-2");
    expect(item.allocations[0]?.folio).toBe(21);
  });

  it("calls GET /finance/payments/rep-exceptions with optional RFC", async () => {
    getMock.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 25, total: 0, total_pages: 1 },
    });

    const result = await financePaymentsApi.getRepExceptions({
      page: 1,
      limit: 25,
      receiverRfc: "XAXX010101000",
    });

    expect(getMock).toHaveBeenCalledWith(
      "/finance/payments/rep-exceptions?page=1&limit=25&receiver_rfc=XAXX010101000",
    );
    expect(result.pagination.total).toBe(0);
  });
});
