import { describe, expect, it, vi, beforeEach } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import type { SendBatchPollResult } from "@features/invoicing/domain";
import { pollSendBatchUntilSettled } from "./sendBatchPoll";

describe("pollSendBatchUntilSettled (C4)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("invalidates invoice detail at terminal when invoiceId is provided", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = {
      invalidateQueries,
    } as unknown as QueryClient;

    const completed: SendBatchPollResult = {
      batchId: "batch-1",
      status: "completed",
      groups: [],
    };

    const pollPromise = pollSendBatchUntilSettled("batch-1", queryClient, {
      intervalMs: 10,
      maxMs: 5_000,
      invoiceId: "inv-send-1",
      getStatus: vi.fn().mockResolvedValue(completed),
    });

    await vi.advanceTimersByTimeAsync(10);
    await pollPromise;

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["invoices", "detail", "inv-send-1"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["invoices", "dispatch-documents"],
    });
  });
});
