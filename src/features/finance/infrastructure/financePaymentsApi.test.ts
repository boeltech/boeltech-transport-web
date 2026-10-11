import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  financePaymentsApi,
  mapOpenPpdPagination,
  mapOpenPpdSummary,
  mapRepExceptionItem,
  mapRepStatusItem,
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

describe("mapOpenPpdSummary", () => {
  it("maps snake_case and camelCase summary payloads", () => {
    expect(
      mapOpenPpdSummary({
        open: 1,
        partial: 2,
        rep_exceptions: 3,
        total_balance: 10.5,
      }),
    ).toEqual({
      open: 1,
      partial: 2,
      repExceptions: 3,
      totalBalance: 10.5,
    });
    expect(
      mapOpenPpdSummary({
        open: 1,
        partial: 2,
        repExceptions: 3,
        totalBalance: 10.5,
      }),
    ).toEqual({
      open: 1,
      partial: 2,
      repExceptions: 3,
      totalBalance: 10.5,
    });
  });
});

describe("financePaymentsApi.getOpenPpdInvoices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists the global queue without receiver_rfc and maps pagination", async () => {
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

    const result = await financePaymentsApi.getOpenPpdInvoices({
      page: 1,
      limit: 50,
      cobrosBucket: "open",
    });

    expect(getMock).toHaveBeenCalledWith(
      "/finance/open-ppd-invoices?page=1&limit=50&cobros_bucket=open",
    );
    expect(result.pagination).toEqual({
      page: 1,
      limit: 50,
      total: 51,
      totalPages: 2,
    });
    expect(result.data[0]?.receiverRfc).toBe("XAXX010101000");
  });

  it("passes optional receiver_rfc and search", async () => {
    getMock.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 50, total: 0, total_pages: 1 },
    });

    await financePaymentsApi.getOpenPpdInvoices({
      receiverRfc: "XAXX010101000",
      search: "Cliente",
      cobrosBucket: "partial",
      page: 2,
      limit: 25,
    });

    expect(getMock).toHaveBeenCalledWith(
      "/finance/open-ppd-invoices?page=2&limit=25&receiver_rfc=XAXX010101000&search=Cliente&cobros_bucket=partial",
    );
  });
});

describe("financePaymentsApi.getOpenPpdSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps summary snake_case without overdue", async () => {
    getMock.mockResolvedValue({
      data: {
        open: 42,
        partial: 7,
        rep_exceptions: 3,
        total_balance: 125000.5,
      },
    });

    const result = await financePaymentsApi.getOpenPpdSummary();

    expect(getMock).toHaveBeenCalledWith("/finance/open-ppd-summary");
    expect(result).toEqual({
      open: 42,
      partial: 7,
      repExceptions: 3,
      totalBalance: 125000.5,
    });
  });
});

describe("mapRepStatusItem / getRepStatusByIds", () => {
  it("maps snake_case rep-status payload to camelCase", () => {
    const item = mapRepStatusItem({
      payment_id: "pay-1",
      rep_status: "pending",
      rep_attempts: 2,
      rep_last_error: null,
      rep_cfdi_uuid: null,
      rep_stamped_at: null,
      rep_next_attempt_at: "2026-10-10T18:00:00.000Z",
      wait_reason: "retry_scheduled",
      rep_error_kind: null,
      invoices: [
        { id: "inv-1", serie: "A", folio: 10, amount: 1160 },
      ],
    });
    expect(item.paymentId).toBe("pay-1");
    expect(item.waitReason).toBe("retry_scheduled");
    expect(item.repErrorKind).toBeNull();
    expect(item.invoices[0]?.folio).toBe(10);
  });

  it("maps pac_clock / quota wait_reason and permanent rep_error_kind", () => {
    const clock = mapRepStatusItem({
      payment_id: "pay-2",
      rep_status: "pending",
      wait_reason: "pac_clock",
      rep_error_kind: null,
      invoices: [],
    });
    expect(clock.waitReason).toBe("pac_clock");

    const quota = mapRepStatusItem({
      payment_id: "pay-3",
      rep_status: "pending",
      wait_reason: "quota",
      rep_error_kind: "quota",
      invoices: [],
    });
    expect(quota.waitReason).toBe("quota");
    expect(quota.repErrorKind).toBe("quota");

    const permanent = mapRepStatusItem({
      payment_id: "pay-4",
      rep_status: "failed",
      wait_reason: null,
      rep_error_kind: "permanent",
      invoices: [],
    });
    expect(permanent.repErrorKind).toBe("permanent");
  });

  it("calls GET /finance/payments/rep-status with comma-separated ids", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          payment_id: "pay-1",
          rep_status: "stamped",
          rep_attempts: 1,
          rep_last_error: null,
          rep_cfdi_uuid: "uuid-1",
          rep_stamped_at: "2026-10-10T12:00:00.000Z",
          rep_next_attempt_at: null,
          wait_reason: null,
          invoices: [],
        },
      ],
    });

    const result = await financePaymentsApi.getRepStatusByIds([
      "pay-1",
      "pay-2",
    ]);

    expect(getMock).toHaveBeenCalledWith(
      "/finance/payments/rep-status?ids=pay-1%2Cpay-2",
    );
    expect(result[0]?.repStatus).toBe("stamped");
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
