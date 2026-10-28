import { describe, expect, it } from "vitest";
import {
  formatCapacityMetric,
  formatPreviewPriceEstimate,
  previewWarningLabel,
} from "./previewFormatters";
import { opsCopy } from "./opsCopy";

describe("previewFormatters", () => {
  it("shows pending price when estimate unavailable", () => {
    expect(
      formatPreviewPriceEstimate({
        currency: "MXN",
        estimatedMonthlyCents: null,
        estimateAvailable: false,
      }),
    ).toBe(opsCopy.preview.pricePending);
  });

  it("formats capacity delta", () => {
    expect(formatCapacityMetric({ from: 2, to: 5, delta: 3 })).toBe(
      "2 → 5 (+3)",
    );
  });

  it("maps known warning codes", () => {
    expect(previewWarningLabel("PLAN_UNCHANGED")).toBe(
      opsCopy.preview.warnings.PLAN_UNCHANGED,
    );
  });
});
