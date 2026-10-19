import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDefaultTerminationDate } from "./defaultTerminationDate";

describe("getDefaultTerminationDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 2026-10-11 23:30 CDMX — en UTC ya es 12 de octubre.
    vi.setSystemTime(new Date("2026-10-12T05:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses Mexico civil day, not UTC", () => {
    expect(new Date().toISOString().slice(0, 10)).toBe("2026-10-12");
    expect(getDefaultTerminationDate()).toBe("2026-10-11");
  });
});
