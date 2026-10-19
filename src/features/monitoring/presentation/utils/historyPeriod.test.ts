import { describe, expect, it } from "vitest";
import {
  historyRangeError,
  isHistoryRangeValid,
  resolveHistoryPreset,
} from "./historyPeriod";
import { HISTORY_MAX_RANGE_MS } from "../../domain";

describe("historyPeriod", () => {
  it("default last4h is ~4 hours", () => {
    const now = new Date("2026-10-19T18:00:00Z");
    const range = resolveHistoryPreset("last4h", now);
    expect(range.to.toISOString()).toBe(now.toISOString());
    expect(range.to.getTime() - range.from.getTime()).toBe(4 * 60 * 60 * 1000);
  });

  it("last24h span is 24h", () => {
    const now = new Date("2026-10-19T18:00:00Z");
    const range = resolveHistoryPreset("last24h", now);
    expect(range.to.getTime() - range.from.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("rejects ranges over 7 days", () => {
    const from = new Date("2026-10-01T00:00:00Z");
    const to = new Date(from.getTime() + HISTORY_MAX_RANGE_MS + 1);
    expect(isHistoryRangeValid(from, to)).toBe(false);
    expect(historyRangeError(from, to)).toBe("max");
  });

  it("rejects inverted order", () => {
    const from = new Date("2026-10-19T18:00:00Z");
    const to = new Date("2026-10-19T12:00:00Z");
    expect(historyRangeError(from, to)).toBe("order");
  });

  it("accepts exactly 7 days", () => {
    const from = new Date("2026-10-12T00:00:00Z");
    const to = new Date(from.getTime() + HISTORY_MAX_RANGE_MS);
    expect(isHistoryRangeValid(from, to)).toBe(true);
  });
});
