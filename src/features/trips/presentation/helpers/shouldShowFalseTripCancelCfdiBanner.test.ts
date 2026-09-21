import { describe, expect, it } from "vitest";

import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { shouldShowFalseTripCancelCfdiBanner } from "./shouldShowFalseTripCancelCfdiBanner";

describe("shouldShowFalseTripCancelCfdiBanner (#32 / T5)", () => {
  it("muestra banner con false_trip + atención + principal activa", () => {
    expect(
      shouldShowFalseTripCancelCfdiBanner({
        operationalOutcome: "false_trip",
        requiresFiscalAttention: true,
        invoicing: tripInvoicingFixture({
          hasActivePrincipalInvoice: true,
          invoiceId: "inv-1",
          invoiceStatus: "stamped",
        }),
      }),
    ).toBe(true);
  });

  it("muestra banner con cancellation_pending si hasActivePrincipalInvoice es false pero status activo", () => {
    expect(
      shouldShowFalseTripCancelCfdiBanner({
        operationalOutcome: "false_trip",
        requiresFiscalAttention: true,
        invoicing: tripInvoicingFixture({
          hasActivePrincipalInvoice: false,
          invoiceId: "inv-pending",
          invoiceStatus: "cancellation_pending",
        }),
      }),
    ).toBe(true);
  });

  it("no muestra banner tras cancel: sin principal activa aunque quede invoiceId cancelada", () => {
    expect(
      shouldShowFalseTripCancelCfdiBanner({
        operationalOutcome: "false_trip",
        requiresFiscalAttention: true,
        invoicing: tripInvoicingFixture({
          hasActivePrincipalInvoice: false,
          invoiceId: "inv-cancelled",
          invoiceStatus: "cancelled",
        }),
      }),
    ).toBe(false);
  });

  it("no muestra banner cuando invoiceId está vacío post-cancel", () => {
    expect(
      shouldShowFalseTripCancelCfdiBanner({
        operationalOutcome: "false_trip",
        requiresFiscalAttention: true,
        invoicing: tripInvoicingFixture({
          hasActivePrincipalInvoice: false,
          invoiceId: null,
          invoiceStatus: null,
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
          hasActivePrincipalInvoice: true,
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
          hasActivePrincipalInvoice: true,
          invoiceId: "inv-1",
          invoiceStatus: "stamped",
        }),
      }),
    ).toBe(false);
  });
});
