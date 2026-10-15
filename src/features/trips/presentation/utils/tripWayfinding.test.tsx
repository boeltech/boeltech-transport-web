import { describe, expect, it } from "vitest";
import { shellCopy } from "../copy/tripDetail/shellCopy";
import {
  isSafeTripReturnHref,
  resolveTripAccessDeniedCopy,
  resolveTripBackHref,
  resolveTripWayfindingBackLabel,
} from "./tripWayfinding";

describe("isSafeTripReturnHref / resolveTripBackHref", () => {
  it("allowlist trips, invoiceable, dispatch, approvals, settlements, factura y listado", () => {
    expect(isSafeTripReturnHref("/trips?status=draft")).toBe(true);
    expect(isSafeTripReturnHref("/trips/abc-1")).toBe(true);
    expect(isSafeTripReturnHref("/finance/invoiceable?bucket=ready")).toBe(
      true,
    );
    expect(isSafeTripReturnHref("/finance/dispatch?tab=sent")).toBe(true);
    expect(
      isSafeTripReturnHref("/finance/approvals?type=trip_expense"),
    ).toBe(true);
    expect(isSafeTripReturnHref("/finance/settlements/new")).toBe(true);
    expect(isSafeTripReturnHref("/invoices/inv-1")).toBe(true);
    expect(isSafeTripReturnHref("/finance/invoices?page=2")).toBe(true);
    expect(isSafeTripReturnHref("/invoices/new")).toBe(false);
    expect(isSafeTripReturnHref("/invoices/inv-1/edit")).toBe(false);
    expect(isSafeTripReturnHref("/dashboard")).toBe(false);
    expect(isSafeTripReturnHref("/settings")).toBe(false);
  });

  it("resolveTripBackHref acepta allowlist y cae en /trips", () => {
    expect(resolveTripBackHref("/invoices/inv-9")).toBe("/invoices/inv-9");
    expect(resolveTripBackHref("/finance/invoices?bucket=stamped")).toBe(
      "/finance/invoices?bucket=stamped",
    );
    expect(resolveTripBackHref("https://evil.example/phish")).toBe("/trips");
    expect(resolveTripBackHref("//evil.example/path")).toBe("/trips");
    expect(resolveTripBackHref("/dashboard")).toBe("/trips");
    expect(resolveTripBackHref(undefined)).toBe("/trips");
  });
});

describe("resolveTripWayfindingBackLabel", () => {
  it("label Volver a la factura desde detalle de factura", () => {
    expect(resolveTripWayfindingBackLabel("/invoices/inv-1")).toBe(
      shellCopy.state.backToInvoice,
    );
  });

  it("label Volver a facturas desde listado Finanzas", () => {
    expect(
      resolveTripWayfindingBackLabel("/finance/invoices?bucket=stamped"),
    ).toBe(shellCopy.state.backToInvoices);
  });

  it("label Volver a aprobaciones desde la bandeja", () => {
    expect(
      resolveTripWayfindingBackLabel(
        "/finance/approvals?type=trip_expense&status=pending",
      ),
    ).toBe(shellCopy.state.backToApprovals);
  });

  it("label Volver a Viajes en el listado", () => {
    expect(resolveTripWayfindingBackLabel("/trips?status=in_progress")).toBe(
      shellCopy.state.backToList,
    );
  });

  it("label Volver a Por facturar desde invoiceable", () => {
    expect(
      resolveTripWayfindingBackLabel("/finance/invoiceable?bucket=ready"),
    ).toBe(shellCopy.state.backToInvoiceable);
  });

  it("label Volver al envío / a envíos desde facturación", () => {
    expect(
      resolveTripWayfindingBackLabel("/finance/dispatch/run-1"),
    ).toBe(shellCopy.state.backToDispatchRun);
    expect(
      resolveTripWayfindingBackLabel("/finance/dispatch?tab=sent"),
    ).toBe(shellCopy.state.backToDispatch);
    expect(
      resolveTripWayfindingBackLabel("/finance/dispatch/period"),
    ).toBe(shellCopy.state.backToDispatchPeriod);
  });

  it("label Volver al pago desde liquidaciones", () => {
    expect(
      resolveTripWayfindingBackLabel(
        "/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15",
      ),
    ).toBe(shellCopy.state.backToSettlementPayment);
    expect(
      resolveTripWayfindingBackLabel(
        "/finance/settlements/11111111-1111-4111-8111-111111111111",
      ),
    ).toBe(shellCopy.state.backToSettlementPayment);
    expect(
      resolveTripWayfindingBackLabel("/finance/settlements/pending-approval"),
    ).toBe(shellCopy.state.backToList);
  });
});

describe("resolveTripAccessDeniedCopy", () => {
  it("cliente: no es tuyo o pide vínculo; back a Mis envíos", () => {
    const denied = resolveTripAccessDeniedCopy(false, true);
    expect(denied.description).toBe(
      shellCopy.state.accessDeniedDescriptionClient,
    );
    expect(denied.backLabel).toBe(shellCopy.state.backToListClient);
  });

  it("conductor conserva copy propio", () => {
    const denied = resolveTripAccessDeniedCopy(true);
    expect(denied.description).toBe(
      shellCopy.state.accessDeniedDescriptionDriver,
    );
    expect(denied.backLabel).toBe(shellCopy.state.backToListDriver);
  });
});
