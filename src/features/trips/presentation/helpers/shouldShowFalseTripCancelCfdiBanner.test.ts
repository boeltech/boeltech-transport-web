import { describe, expect, it } from "vitest";

import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { shouldShowFalseTripCancelCfdiBanner } from "./shouldShowFalseTripCancelCfdiBanner";

describe("shouldShowFalseTripCancelCfdiBanner (#32 / T5)", () => {
  it("muestra banner con false_trip + atención + flete primary_transport activo", () => {
    expect(
      shouldShowFalseTripCancelCfdiBanner({
        operationalOutcome: "false_trip",
        requiresFiscalAttention: true,
        invoicing: tripInvoicingFixture({
          hasActivePrimaryInvoice: true,
          hasActivePrincipalInvoice: true,
          invoiceId: "inv-freight",
          invoiceStatus: "stamped",
        }),
      }),
    ).toBe(true);
  });

  it("no muestra banner si solo hay principal false_trip (sin flete CP)", () => {
    expect(
      shouldShowFalseTripCancelCfdiBanner({
        operationalOutcome: "false_trip",
        requiresFiscalAttention: true,
        invoicing: tripInvoicingFixture({
          hasActivePrimaryInvoice: false,
          hasActivePrincipalInvoice: true,
          invoiceId: "inv-false-trip",
          invoiceStatus: "stamped",
        }),
      }),
    ).toBe(false);
  });

  it("no muestra banner tras cancel del flete: sin primary activa", () => {
    expect(
      shouldShowFalseTripCancelCfdiBanner({
        operationalOutcome: "false_trip",
        requiresFiscalAttention: true,
        invoicing: tripInvoicingFixture({
          hasActivePrimaryInvoice: false,
          hasActivePrincipalInvoice: false,
          invoiceId: "inv-cancelled",
          invoiceStatus: "cancelled",
        }),
      }),
    ).toBe(false);
  });

  it("no muestra banner si requiresFiscalAttention es false (API ya limpió)", () => {
    expect(
      shouldShowFalseTripCancelCfdiBanner({
        operationalOutcome: "false_trip",
        requiresFiscalAttention: false,
        invoicing: tripInvoicingFixture({
          hasActivePrimaryInvoice: true,
          invoiceId: "inv-1",
          invoiceStatus: "stamped",
        }),
      }),
    ).toBe(false);
  });

  it("no muestra banner fuera de false_trip", () => {
    expect(
      shouldShowFalseTripCancelCfdiBanner({
        operationalOutcome: "standard",
        requiresFiscalAttention: true,
        invoicing: tripInvoicingFixture({
          hasActivePrimaryInvoice: true,
          invoiceId: "inv-1",
          invoiceStatus: "stamped",
        }),
      }),
    ).toBe(false);
  });
});
