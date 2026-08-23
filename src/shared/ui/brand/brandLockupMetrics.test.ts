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

  it("nudges wordmark down for optical centering (sidebar calib: 30 → 2.4px)", () => {
    expect(BRAND_LOCKUP.WORDMARK_OPTICAL_Y_OFFSET_RATIO).toBe(0.08);
    expect(brandLockupWordmarkOpticalOffsetPx(30)).toBeCloseTo(2.4);
    expect(brandLockupWordmarkOpticalOffsetPx(100)).toBe(8);
    expect(brandLockupWordmarkOpticalOffsetPx(32)).toBeCloseTo(2.56);
  });
});
