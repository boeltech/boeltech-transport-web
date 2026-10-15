import { describe, expect, it } from "vitest";

import { invoicingCopy } from "../copy/invoicingCopy";
import {
  isSafeInvoiceReturnHref,
  isTripAppHref,
  resolveInvoiceAccessDeniedCopy,
  resolveInvoiceBackHref,
  resolveInvoiceWayfindingBackLabel,
} from "./invoiceWayfinding";

describe("invoiceWayfinding", () => {
  it("reconoce hrefs de viaje", () => {
    expect(isTripAppHref("/trips")).toBe(true);
    expect(isTripAppHref("/trips?status=draft")).toBe(true);
    expect(isTripAppHref("/trips/abc")).toBe(true);
    expect(isTripAppHref("/finance/invoices")).toBe(false);
  });

  it("allowlist de vuelta desde factura", () => {
    expect(isSafeInvoiceReturnHref("/finance/invoices?status=stamped")).toBe(
      true,
    );
    expect(isSafeInvoiceReturnHref("/finance/invoiceable")).toBe(true);
    expect(
      isSafeInvoiceReturnHref("/finance/invoiceable?bucket=ready"),
    ).toBe(true);
    expect(isSafeInvoiceReturnHref("/finance/cobros")).toBe(true);
    expect(isSafeInvoiceReturnHref("/finance/dispatch?tab=sent")).toBe(true);
    expect(isSafeInvoiceReturnHref("/trips/t-1")).toBe(true);
    expect(isSafeInvoiceReturnHref("/settings")).toBe(false);
    expect(isSafeInvoiceReturnHref("/finance/settlements")).toBe(false);
  });

  it("resolveInvoiceBackHref acepta colas allowlist y cae en fallback", () => {
    expect(resolveInvoiceBackHref("/finance/invoices?page=2")).toBe(
      "/finance/invoices?page=2",
    );
    expect(resolveInvoiceBackHref("/finance/invoiceable?bucket=blocked")).toBe(
      "/finance/invoiceable?bucket=blocked",
    );
    expect(resolveInvoiceBackHref("/trips/abc-1")).toBe("/trips/abc-1");
    expect(resolveInvoiceBackHref("/finance/dispatch?tab=sent")).toBe(
      "/finance/dispatch?tab=sent",
    );
    expect(resolveInvoiceBackHref("https://evil.example/phish")).toBe(
      "/finance/invoices",
    );
    expect(resolveInvoiceBackHref("//evil.example/path")).toBe(
      "/finance/invoices",
    );
    expect(resolveInvoiceBackHref("/settings/approvals")).toBe(
      "/finance/invoices",
    );
    expect(resolveInvoiceBackHref("/invoices/new?trip_id=1")).toBe(
      "/finance/invoices",
    );
    expect(
      resolveInvoiceBackHref("https://evil.example", { tripId: "trip-9" }),
    ).toBe("/trips/trip-9");
  });

  it("label Volver al viaje en detalle", () => {
    expect(resolveInvoiceWayfindingBackLabel("/trips/abc-1")).toBe(
      invoicingCopy.blocked.backToTrip,
    );
  });

  it("label Volver a viajes en listado", () => {
    expect(resolveInvoiceWayfindingBackLabel("/trips?status=in_progress")).toBe(
      invoicingCopy.empty.backToTrips,
    );
  });

  it("label Volver a Por facturar", () => {
    expect(
      resolveInvoiceWayfindingBackLabel("/finance/invoiceable?bucket=ready"),
    ).toBe(invoicingCopy.detail.header.backToInvoiceable);
  });

  it("label Volver a cobros / envíos", () => {
    expect(
      resolveInvoiceWayfindingBackLabel("/finance/cobros?rfc=AAA"),
    ).toBe(invoicingCopy.detail.header.backToCobros);
    expect(
      resolveInvoiceWayfindingBackLabel("/finance/dispatch?tab=sent"),
    ).toBe(invoicingCopy.detail.header.backToDispatch);
    expect(
      resolveInvoiceWayfindingBackLabel(
        "/finance/dispatch/period?dispatch_status=cancelled",
      ),
    ).toBe(invoicingCopy.detail.header.backToDispatchPeriod);
    expect(
      resolveInvoiceWayfindingBackLabel("/finance/dispatch/run-1"),
    ).toBe(invoicingCopy.detail.header.backToDispatchRun);
  });

  it("label default fuera de viajes", () => {
    expect(resolveInvoiceWayfindingBackLabel("/finance/invoices")).toBe(
      invoicingCopy.detail.header.backLabel,
    );
  });

  it("cliente: back a Mis facturas desde el listado portal", () => {
    expect(
      resolveInvoiceWayfindingBackLabel("/finance/invoices", {
        isClientPortal: true,
      }),
    ).toBe(invoicingCopy.detail.header.backToClientInvoices);
  });
});

describe("resolveInvoiceAccessDeniedCopy", () => {
  it("cliente: no es tuya o pide vínculo; back a Mis facturas", () => {
    const denied = resolveInvoiceAccessDeniedCopy(true);
    expect(denied.description).toBe(
      invoicingCopy.detail.forbidden.descriptionClient,
    );
    expect(denied.backLabel).toBe(
      invoicingCopy.detail.header.backToClientInvoices,
    );
    expect(denied.backHref).toBe("/finance/invoices");
  });

  it("staff conserva 403 genérico", () => {
    const denied = resolveInvoiceAccessDeniedCopy(false);
    expect(denied.description).toBe(invoicingCopy.detail.forbidden.description);
    expect(denied.backLabel).toBe(invoicingCopy.detail.notFound.backLabel);
  });
});
