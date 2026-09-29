import { describe, expect, it } from "vitest";
import {
  COBROS_PAYMENT_TIME,
  normalizeCobrosPaymentTime,
} from "./financeCobrosConfig";

describe("normalizeCobrosPaymentTime", () => {
  it("defaults to midday when empty", () => {
    expect(normalizeCobrosPaymentTime("")).toBe(COBROS_PAYMENT_TIME);
    expect(normalizeCobrosPaymentTime(undefined)).toBe(COBROS_PAYMENT_TIME);
    expect(normalizeCobrosPaymentTime("   ")).toBe(COBROS_PAYMENT_TIME);
  });

  it("expands HH:mm to HH:mm:ss", () => {
    expect(normalizeCobrosPaymentTime("12:00")).toBe("12:00:00");
    expect(normalizeCobrosPaymentTime("09:30")).toBe("09:30:00");
  });

  it("keeps HH:mm:ss as-is", () => {
    expect(normalizeCobrosPaymentTime("15:45:00")).toBe("15:45:00");
  });
});
