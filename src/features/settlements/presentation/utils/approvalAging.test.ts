import { describe, expect, it } from "vitest";
import { approvalAgeDays, isApprovalAgingWarning } from "./approvalAging";

describe("approvalAging (C27)", () => {
  const now = Date.parse("2026-11-10T12:00:00.000Z");

  it("cuenta días desde submittedAt", () => {
    expect(approvalAgeDays("2026-11-08T10:00:00.000Z", now)).toBe(2);
    expect(approvalAgeDays("2026-11-10T08:00:00.000Z", now)).toBe(0);
  });

  it("null sin fecha", () => {
    expect(approvalAgeDays(null, now)).toBeNull();
    expect(approvalAgeDays(undefined, now)).toBeNull();
  });

  it("warning solo si > 1 día", () => {
    expect(isApprovalAgingWarning(0)).toBe(false);
    expect(isApprovalAgingWarning(1)).toBe(false);
    expect(isApprovalAgingWarning(2)).toBe(true);
    expect(isApprovalAgingWarning(null)).toBe(false);
  });
});
