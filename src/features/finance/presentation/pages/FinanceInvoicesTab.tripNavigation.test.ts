import { describe, expect, it } from "vitest";
import { resolveFinanceInvoicesTabTripTarget } from "../utils/financeInvoiceFromTripCta";

describe("resolveFinanceInvoicesTabTripTarget (ADR-0081 + PreStampV2)", () => {
  it("opens trip invoicing hub when hasActiveSplit is true", () => {
    expect(
      resolveFinanceInvoicesTabTripTarget({
        id: "trip-split",
        invoicing: {
          hasActiveSplit: true,
          canGenerateInvoice: true,
        },
      }),
    ).toBe("/trips/trip-split");
  });

  it("opens invoice create path when primary is ready", () => {
    expect(
      resolveFinanceInvoicesTabTripTarget({
        id: "trip-1",
        invoicing: {
          hasActiveSplit: false,
          canGenerateInvoice: true,
        },
      }),
    ).toBe("/invoices/new?trip_id=trip-1");
  });

  it("opens trip hub when primary is not ready", () => {
    expect(
      resolveFinanceInvoicesTabTripTarget({
        id: "trip-blocked",
        invoicing: {
          hasActiveSplit: false,
          canGenerateInvoice: false,
          blockReason: "Completa la ruta antes de facturar.",
        },
      }),
    ).toBe("/trips/trip-blocked");
  });

  it("passes false_trip scope on create path when ready", () => {
    expect(
      resolveFinanceInvoicesTabTripTarget({
        id: "trip-false",
        operationalOutcome: "false_trip",
        invoicing: {
          hasActiveSplit: false,
          canGenerateFalseTripInvoice: true,
        },
      }),
    ).toBe("/invoices/new?trip_id=trip-false&scope=false_trip");
  });

  it("opens trip hub for false_trip when not ready", () => {
    expect(
      resolveFinanceInvoicesTabTripTarget({
        id: "trip-false",
        operationalOutcome: "false_trip",
        invoicing: {
          hasActiveSplit: false,
          canGenerateFalseTripInvoice: false,
        },
      }),
    ).toBe("/trips/trip-false");
  });
});
