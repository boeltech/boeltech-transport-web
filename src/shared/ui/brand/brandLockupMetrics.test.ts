import { describe, expect, it } from "vitest";
import {
  BRAND_LOCKUP,
  brandLockupGapPx,
  brandLockupWordmarkFontSizePx,
  brandLockupWordmarkOpticalOffsetPx,
} from "./brandLockupMetrics";

describe("brandLockupMetrics", () => {
  it("derives gap and font-size from Rilxer ratios", () => {
    expect(brandLockupGapPx(100)).toBe(50);
    expect(brandLockupWordmarkFontSizePx(100)).toBe(100);
    expect(brandLockupGapPx(30)).toBe(15);
  });

  it("applies light Schibsted optical Y nudge (markSize 32 → +1.28px)", () => {
    expect(BRAND_LOCKUP.WORDMARK_OPTICAL_Y_OFFSET_RATIO).toBe(0.04);
    expect(brandLockupWordmarkOpticalOffsetPx(32)).toBeCloseTo(1.28);
    expect(brandLockupWordmarkOpticalOffsetPx(30)).toBeCloseTo(1.2);
    expect(brandLockupWordmarkOpticalOffsetPx(100)).toBe(4);
  });
});
