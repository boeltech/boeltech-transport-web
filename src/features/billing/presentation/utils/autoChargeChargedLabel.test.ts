import { describe, expect, it } from "vitest";
import type { BillingArrearsInvoice } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import { resolveAutoChargeChargedLabel } from "./autoChargeChargedLabel";

const invoice = (
  overrides: Partial<BillingArrearsInvoice> = {},
): BillingArrearsInvoice => ({
  id: "inv-1",
  periodKey: "2026-08",
  status: "open",
  totalCents: 1000,
  amountDueCents: 1000,
  dueDate: null,
  daysOverdue: 0,
  issuedAt: null,
  lastAutoCharge: null,
  ...overrides,
});

describe("resolveAutoChargeChargedLabel", () => {
  it("returns null when there is no paid + charged evidence", () => {
    expect(
      resolveAutoChargeChargedLabel(
        [
          invoice({
            lastAutoCharge: {
              outcome: "charged",
              skipReason: null,
              failureCode: null,
              createdAt: "2026-09-01T00:00:00.000Z",
            },
          }),
        ],
        () => "ago 2026",
      ),
    ).toBeNull();
    expect(resolveAutoChargeChargedLabel(undefined, () => "x")).toBeNull();
  });

  it("labels only a visible paid period with charged outcome", () => {
    expect(
      resolveAutoChargeChargedLabel(
        [
          invoice({
            status: "paid",
            lastAutoCharge: {
              outcome: "charged",
              skipReason: null,
              failureCode: null,
              createdAt: "2026-09-01T00:00:00.000Z",
            },
          }),
        ],
        () => "ago 2026",
      ),
    ).toBe(billingCopy.planStatusStrip.chargedPeriod("ago 2026"));
  });
});
