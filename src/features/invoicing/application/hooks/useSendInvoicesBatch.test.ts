import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  pollSendBatchUntilSettled,
  useSendInvoicesBatch,
} from "./useSendInvoicesBatch";

const sendInvoicesBatch = vi.fn();
const getSendBatchStatus = vi.fn();
const invalidateQueries = vi.fn().mockResolvedValue(undefined);
const toast = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries,
    setQueryData: vi.fn(),
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast }),
}));

vi.mock("@features/invoicing/infrastructure", () => ({
  invoicingApi: {
    sendInvoicesBatch: (...args: unknown[]) => sendInvoicesBatch(...args),
    getSendBatchStatus: (...args: unknown[]) => getSendBatchStatus(...args),
  },
}));

describe("useSendInvoicesBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSendBatchStatus.mockResolvedValue({
      batchId: "batch-1",
      status: "completed",
      groups: [],
    });
  });

  it("posts one send-batch with all client groups and treats queued as ok", async () => {
    sendInvoicesBatch.mockResolvedValueOnce({
      batchId: "batch-1",
      status: "queued",
      groups: [
        {
          groupKey: "client-a",
          clientId: "client-a",
          status: "queued",
          errorMessage: null,
          errorCode: null,
          invoiceIds: ["inv-1", "inv-2"],
        },
        {
          groupKey: "client-b",
          clientId: "client-b",
          status: "failed",
          errorMessage: "ZIP too large",
          errorCode: "INVOICE_DISPATCH_ZIP_TOO_LARGE",
          invoiceIds: ["inv-3"],
        },
      ],
      summary: {
        clientsQueued: 1,
        clientsSkipped: 0,
        clientsFailed: 1,
        invoicesQueued: 2,
      },
    });

    const { result } = renderHook(() => useSendInvoicesBatch());

    let batchResults: Awaited<ReturnType<typeof result.current.sendBatch>> = [];
    await act(async () => {
      batchResults = await result.current.sendBatch([
        {
          groupKey: "client-a",
          clientLabel: "Cliente A",
          invoiceIds: ["inv-1", "inv-2"],
          folioLabels: ["A-1", "A-2"],
          recipientKeys: undefined,
        },
        {
          groupKey: "client-b",
          clientLabel: "Cliente B",
          invoiceIds: ["inv-3"],
          folioLabels: ["A-3"],
          recipientKeys: ["billing_email"],
        },
      ]);
    });

    expect(sendInvoicesBatch).toHaveBeenCalledTimes(1);
    expect(sendInvoicesBatch).toHaveBeenCalledWith({
      groups: [
        { invoiceIds: ["inv-1", "inv-2"], recipientKeys: undefined },
        { invoiceIds: ["inv-3"], recipientKeys: ["billing_email"] },
      ],
    });

    expect(batchResults).toEqual([
      {
        groupKey: "client-a",
        clientLabel: "Cliente A",
        invoiceIds: ["inv-1", "inv-2"],
        folioLabels: ["A-1", "A-2"],
        ok: true,
        status: "queued",
        errorMessage: undefined,
      },
      {
        groupKey: "client-b",
        clientLabel: "Cliente B",
        invoiceIds: ["inv-3"],
        folioLabels: ["A-3"],
        ok: false,
        status: "failed",
        errorMessage: "ZIP too large",
      },
    ]);

    expect(invalidateQueries).toHaveBeenCalled();
  });

  it("marks all groups failed when the POST throws", async () => {
    sendInvoicesBatch.mockRejectedValueOnce(new Error("Network down"));

    const { result } = renderHook(() => useSendInvoicesBatch());

    let batchResults: Awaited<ReturnType<typeof result.current.sendBatch>> = [];
    await act(async () => {
      batchResults = await result.current.sendBatch([
        {
          groupKey: "client-a",
          clientLabel: "Cliente A",
          invoiceIds: ["inv-1"],
          folioLabels: ["A-1"],
        },
      ]);
    });

    expect(batchResults).toHaveLength(1);
    expect(batchResults[0]!.ok).toBe(false);
    expect(batchResults[0]!.status).toBe("failed");
    expect(batchResults[0]!.errorMessage).toMatch(/Network down/i);
  });
});

describe("pollSendBatchUntilSettled", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns when batch reaches completed and invalidates lists", async () => {
    const getStatus = vi
      .fn()
      .mockResolvedValueOnce({
        batchId: "b1",
        status: "processing",
        groups: [],
      })
      .mockResolvedValueOnce({
        batchId: "b1",
        status: "completed",
        groups: [
          {
            groupKey: "g1",
            clientId: "c1",
            status: "sent",
            errorCode: null,
            errorMessage: null,
            invoiceIds: ["inv-1"],
          },
        ],
      });

    const queryClient = {
      invalidateQueries: vi.fn().mockResolvedValue(undefined),
    };

    const promise = pollSendBatchUntilSettled("b1", queryClient as never, {
      intervalMs: 100,
      maxMs: 5_000,
      getStatus,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(100);
    });

    const settled = await promise;
    expect(settled?.status).toBe("completed");
    expect(getStatus).toHaveBeenCalledTimes(2);
    expect(queryClient.invalidateQueries).toHaveBeenCalled();
  });
});
