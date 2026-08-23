import { describe, expect, it } from "vitest";
import {
  buildInvoiceCreatePathFromTrip,
  buildTripInvoicingHubPath,
  canShowInvoiceFromTripCta,
  FINANCE_INVOICE_FROM_TRIP_CTA,
  shouldOpenInvoiceCreateFromFinanceHub,
} from "./financeInvoiceFromTripCta";

describe("canShowInvoiceFromTripCta", () => {
  it("requiere invoices.create y trips.read", () => {
    const has = (module: string, action: string) =>
      module === "invoices" && action === "create";

    expect(canShowInvoiceFromTripCta(has)).toBe(false);
  });

  it("es true cuando el rol puede crear facturas y leer viajes", () => {
    const has = (module: string, action: string) =>
      (module === "invoices" && action === "create") ||
      (module === "trips" && action === "read");

    expect(canShowInvoiceFromTripCta(has)).toBe(true);
  });

  it("manda el empty state a la cola de viajes por facturar", () => {
    expect(FINANCE_INVOICE_FROM_TRIP_CTA.label).toBe("Ver viajes por facturar");
    expect(FINANCE_INVOICE_FROM_TRIP_CTA.invoiceablePath).toBe(
      "/finance?tab=invoiceable",
    );
  });
});

describe("buildInvoiceCreatePathFromTrip", () => {
  it("abre flete+CP para un viaje standard", () => {
    expect(buildInvoiceCreatePathFromTrip({ id: "trip-1" })).toBe(
      "/invoices/new?trip_id=trip-1",
    );
  });

  it("abre scope=false_trip cuando el viaje es falso", () => {
    expect(
      buildInvoiceCreatePathFromTrip({
        id: "trip-1",
        operationalOutcome: "false_trip",
      }),
    ).toBe("/invoices/new?trip_id=trip-1&scope=false_trip");
  });
});

describe("shouldOpenInvoiceCreateFromFinanceHub (ADR-0081)", () => {
  it("bloquea alta primaria cuando hay split activo", () => {
    expect(
      shouldOpenInvoiceCreateFromFinanceHub({
        id: "trip-1",
        invoicing: { hasActiveSplit: true },
      }),
    ).toBe(false);
  });

  it("permite alta cuando no hay split activo", () => {
    expect(
      shouldOpenInvoiceCreateFromFinanceHub({
        id: "trip-1",
        invoicing: { hasActiveSplit: false },
      }),
    ).toBe(true);
  });
});

describe("buildTripInvoicingHubPath", () => {
  it("abre el detalle del viaje", () => {
    expect(buildTripInvoicingHubPath("trip-42")).toBe("/trips/trip-42");
  });
});
