import { describe, expect, it } from "vitest";

import { formatDataUpdatedAgo } from "./trackingGpsCapture";

describe("formatDataUpdatedAgo", () => {
  it("formats seconds and minutes", () => {
    const now = 1_700_000_000_000;
    expect(formatDataUpdatedAgo(now - 15_000, now)).toBe("hace 15 s");
    expect(formatDataUpdatedAgo(now - 120_000, now)).toBe("hace 2 min");
  });
});
