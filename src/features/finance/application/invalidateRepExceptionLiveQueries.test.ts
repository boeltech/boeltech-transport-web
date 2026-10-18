import { describe, expect, it, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "./financeQueryKeys";
import {
  consumeRepExceptionExits,
  invalidateRepExceptionLiveQueries,
} from "./invalidateRepExceptionLiveQueries";

describe("consumeRepExceptionExits", () => {
  it("returns false on the first poll tick for pending", () => {
    const prev = new Map<string, string>();
    expect(
      consumeRepExceptionExits(prev, [
        { paymentId: "pay-1", repStatus: "pending" },
      ]),
    ).toBe(false);
    expect(prev.get("pay-1")).toBe("pending");
  });

  it("returns false when pending stays pending (poll tick)", () => {
    const prev = new Map([["pay-1", "pending"]]);
    expect(
      consumeRepExceptionExits(prev, [
        { paymentId: "pay-1", repStatus: "pending" },
      ]),
    ).toBe(false);
  });

  it("returns true when pending → stamped", () => {
    const prev = new Map([["pay-1", "pending"]]);
    expect(
      consumeRepExceptionExits(prev, [
        { paymentId: "pay-1", repStatus: "stamped" },
      ]),
    ).toBe(true);
    expect(prev.get("pay-1")).toBe("stamped");
  });

  it("returns true if any watched payment leaves exception", () => {
    const prev = new Map([
      ["pay-1", "pending"],
      ["pay-2", "failed"],
    ]);
    expect(
      consumeRepExceptionExits(prev, [
        { paymentId: "pay-1", repStatus: "pending" },
        { paymentId: "pay-2", repStatus: "stamped" },
      ]),
    ).toBe(true);
  });
});

describe("invalidateRepExceptionLiveQueries", () => {
  it("invalidates open-ppd-summary and rep-exceptions prefixes", () => {
    const invalidateQueries = vi.fn();
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    invalidateRepExceptionLiveQueries(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: financeQueryKeys.openPpdSummaryRoot(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: financeQueryKeys.repExceptionsRoot(),
    });
    expect(financeQueryKeys.openPpdSummaryRoot()).toEqual([
      "finance",
      "open-ppd-summary",
    ]);
    expect(financeQueryKeys.repExceptionsRoot()).toEqual([
      "finance",
      "rep-exceptions",
    ]);
  });
});
