import { describe, expect, it } from "vitest";

import { invoicingCopy } from "../copy/invoicingCopy";
import {
  isTripAppHref,
  resolveInvoiceAccessDeniedCopy,
  resolveInvoiceWayfindingBackLabel,
} from "./invoiceWayfinding";

describe("invoiceWayfinding", () => {
  it("reconoce hrefs de viaje", () => {
    expect(isTripAppHref("/trips")).toBe(true);
    expect(isTripAppHref("/trips?status=draft")).toBe(true);
    expect(isTripAppHref("/trips/abc")).toBe(true);
    expect(isTripAppHref("/finance/invoices")).toBe(false);
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
