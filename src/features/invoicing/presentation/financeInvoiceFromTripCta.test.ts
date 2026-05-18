import { describe, expect, it } from "vitest";
import {
  canShowInvoiceFromTripCta,
  FINANCE_INVOICE_FROM_TRIP_CTA,
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

  it("expone copy estable para toolbar y empty state", () => {
    expect(FINANCE_INVOICE_FROM_TRIP_CTA.label).toBe("Facturar desde viaje");
    expect(FINANCE_INVOICE_FROM_TRIP_CTA.tripsPath).toBe("/trips");
  });
});
