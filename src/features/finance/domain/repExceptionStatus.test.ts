import { describe, expect, it } from "vitest";
import {
  isRepExceptionStatus,
  leftRepExceptionStatus,
} from "./repExceptionStatus";

describe("isRepExceptionStatus", () => {
  it("matches API exception allowlist (pending included)", () => {
    expect(isRepExceptionStatus("pending")).toBe(true);
    expect(isRepExceptionStatus("failed")).toBe(true);
    expect(isRepExceptionStatus("restamp_pending")).toBe(true);
    expect(isRepExceptionStatus("cancelling")).toBe(true);
  });

  it("rejects non-exception live statuses", () => {
    expect(isRepExceptionStatus("stamped")).toBe(false);
    expect(isRepExceptionStatus("cancelled")).toBe(false);
    expect(isRepExceptionStatus("not_required")).toBe(false);
  });
});

describe("leftRepExceptionStatus", () => {
  it("is false on first observation (no previous status)", () => {
    expect(leftRepExceptionStatus(undefined, "pending")).toBe(false);
    expect(leftRepExceptionStatus(undefined, "stamped")).toBe(false);
  });

  it("is false when status is unchanged", () => {
    expect(leftRepExceptionStatus("pending", "pending")).toBe(false);
    expect(leftRepExceptionStatus("stamped", "stamped")).toBe(false);
  });

  it("is false when staying inside exception set", () => {
    expect(leftRepExceptionStatus("pending", "failed")).toBe(false);
    expect(leftRepExceptionStatus("failed", "restamp_pending")).toBe(false);
  });

  it("is true when leaving exception (e.g. pending → stamped)", () => {
    expect(leftRepExceptionStatus("pending", "stamped")).toBe(true);
    expect(leftRepExceptionStatus("failed", "stamped")).toBe(true);
    expect(leftRepExceptionStatus("restamp_pending", "stamped")).toBe(true);
    expect(leftRepExceptionStatus("cancelling", "cancelled")).toBe(true);
  });

  it("is false when entering exception or moving between non-exception", () => {
    expect(leftRepExceptionStatus("stamped", "failed")).toBe(false);
    expect(leftRepExceptionStatus("not_required", "cancelled")).toBe(false);
  });
});
