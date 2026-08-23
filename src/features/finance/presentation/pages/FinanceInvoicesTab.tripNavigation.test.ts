import { describe, expect, it } from "vitest";
import { resolveFinanceInvoicesTabTripTarget } from "../utils/financeInvoiceFromTripCta";

describe("resolveFinanceInvoicesTabTripTarget (ADR-0081)", () => {
  it("opens trip invoicing hub when hasActiveSplit is true", () => {
    expect(
      resolveFinanceInvoicesTabTripTarget({
        id: "trip-split",
        invoicing: { hasActiveSplit: true },
      }),
    ).toBe("/trips/trip-split");
  });

  it("opens invoice create path when hasActiveSplit is false", () => {
    expect(
      resolveFinanceInvoicesTabTripTarget({
        id: "trip-1",
        invoicing: { hasActiveSplit: false },
      }),
    ).toBe("/invoices/new?trip_id=trip-1");
  });

  it("passes false_trip scope on create path", () => {
    expect(
      resolveFinanceInvoicesTabTripTarget({
        id: "trip-false",
        operationalOutcome: "false_trip",
        invoicing: { hasActiveSplit: false },
      }),
    ).toBe("/invoices/new?trip_id=trip-false&scope=false_trip");
  });
});
