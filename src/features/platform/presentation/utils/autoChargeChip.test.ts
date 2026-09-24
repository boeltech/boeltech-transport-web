import { describe, expect, it } from "vitest";
import type {
  PlatformChargeRunAttempt,
  PlatformChargeRunItem,
} from "../../domain/entities";
import {
  chargeRunNeedsAttention,
  resolveAutoChargeChip,
} from "./autoChargeChip";

const attempt = (
  overrides: Partial<PlatformChargeRunAttempt> = {},
): PlatformChargeRunAttempt => ({
  saasInvoiceId: "inv-1",
  outcome: "failed",
  skipReason: null,
  failureCode: "card_declined",
  createdAt: "2026-09-23T12:00:00.000Z",
  ...overrides,
});

const item = (
  overrides: Partial<PlatformChargeRunItem> = {},
): PlatformChargeRunItem => ({
  tenantId: "t1",
  tenantName: "Demo",
  subdomain: "demo",
  saasInvoiceId: "inv-1",
  periodKey: "2026-08",
  outcome: "skipped",
  skipReason: "NO_PAYMENT_METHOD",
  failureCode: null,
  gatewayPaymentId: null,
  createdAt: "2026-09-23T12:00:00.000Z",
  ...overrides,
});

describe("resolveAutoChargeChip", () => {
  it("uses latest_attempts over a skip in the same run", () => {
    expect(
      resolveAutoChargeChip({
        invoiceId: "inv-1",
        latestAttempts: [attempt({ outcome: "failed" })],
        runItems: [item()],
      }),
    ).toBe("failed");
  });

  it("shows Sin tarjeta only for NO_PAYMENT_METHOD skip without an attempt", () => {
    expect(
      resolveAutoChargeChip({
        invoiceId: "inv-1",
        latestAttempts: [],
        runItems: [item()],
      }),
    ).toBe("no_payment_method");
  });

  it("hides chip on other skips without an attempt", () => {
    expect(
      resolveAutoChargeChip({
        invoiceId: "inv-1",
        latestAttempts: [],
        runItems: [item({ skipReason: "ALREADY_PAID" })],
      }),
    ).toBeNull();
  });

  it("returns null when the invoice has no attempt and no matching item", () => {
    expect(
      resolveAutoChargeChip({
        invoiceId: "inv-other",
        latestAttempts: [attempt()],
        runItems: [item()],
      }),
    ).toBeNull();
  });
});

describe("chargeRunNeedsAttention", () => {
  it("flags failed, 3DS or missing card", () => {
    expect(
      chargeRunNeedsAttention({
        charged: 8,
        noPaymentMethod: 0,
        failed: 0,
        requiresAction: 0,
        processing: 0,
        skippedOther: 0,
      }),
    ).toBe(false);
    expect(
      chargeRunNeedsAttention({
        charged: 8,
        noPaymentMethod: 1,
        failed: 0,
        requiresAction: 0,
        processing: 0,
        skippedOther: 0,
      }),
    ).toBe(true);
  });
});
