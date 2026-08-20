import { describe, expect, it } from "vitest";
import { formatFinancePaymentMethodLabel } from "./formatFinancePaymentMethod";

describe("formatFinancePaymentMethodLabel", () => {
  it("maps PPD/PUE to operational labels", () => {
    expect(formatFinancePaymentMethodLabel("PPD")).toBe("A crédito");
    expect(formatFinancePaymentMethodLabel("ppd")).toBe("A crédito");
    expect(formatFinancePaymentMethodLabel("PUE")).toBe("De contado");
    expect(formatFinancePaymentMethodLabel(" pue ")).toBe("De contado");
  });

  it("falls back to the raw value when unknown", () => {
    expect(formatFinancePaymentMethodLabel("OTHER")).toBe("OTHER");
    expect(formatFinancePaymentMethodLabel("")).toBe("—");
  });
});
