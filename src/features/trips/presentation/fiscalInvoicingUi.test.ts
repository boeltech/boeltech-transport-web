import { describe, expect, it } from "vitest";
import { TripStatus } from "@features/trips/domain";
import { getTripInvoicingBadgeConfig, getTripInvoicingBlockReason } from "./uiHelpers";

describe("getTripInvoicingBadgeConfig", () => {
  it("muestra borrador en viaje programado cuando hay factura ligada (pre-stamp)", () => {
    const cfg = getTripInvoicingBadgeConfig({
      status: TripStatus.SCHEDULED,
      invoicing: {
        hasActiveInvoice: false,
        canGenerateInvoice: false,
        invoiceId: "inv-1",
        invoiceFolio: null,
        invoiceCfdiUuid: null,
        invoiceStatus: "draft",
        blockReason: null,
      },
    });
    expect(cfg.label).toBe("Borrador");
  });

  it("muestra facturado con UUID aunque el estado venga vacío pero hasActiveInvoice sea true", () => {
    const cfg = getTripInvoicingBadgeConfig({
      status: TripStatus.IN_PROGRESS,
      invoicing: {
        hasActiveInvoice: true,
        canGenerateInvoice: false,
        invoiceId: "inv-2",
        invoiceFolio: "A-1",
        invoiceCfdiUuid: "AAAABBBB-CCCC-DDDD-EEEE-FFFFFFFFFFFF",
        invoiceStatus: null,
        blockReason: null,
      },
    });
    expect(cfg.label).toBe("Facturado");
  });

  it("en viaje sin factura muestra Disponible cuando el API permite generar (pre-stamp)", () => {
    const cfg = getTripInvoicingBadgeConfig({
      status: TripStatus.SCHEDULED,
      invoicing: {
        hasActiveInvoice: false,
        canGenerateInvoice: true,
        invoiceId: null,
        invoiceFolio: null,
        invoiceCfdiUuid: null,
        invoiceStatus: null,
        blockReason: null,
      },
    });
    expect(cfg.label).toBe("Disponible");
  });
});

describe("getTripInvoicingBlockReason", () => {
  it("no devuelve bloqueo del API cuando ya hay borrador ligado", () => {
    expect(
      getTripInvoicingBlockReason({
        hasActiveInvoice: false,
        canGenerateInvoice: false,
        invoiceId: "inv-1",
        invoiceFolio: "A-1",
        invoiceCfdiUuid: null,
        invoiceStatus: "draft",
        blockReason: "Solo los viajes completados pueden facturarse.",
      }),
    ).toBeNull();
  });

  it("sí devuelve block_reason cuando no hay factura ligada y no se puede generar", () => {
    expect(
      getTripInvoicingBlockReason({
        hasActiveInvoice: false,
        canGenerateInvoice: false,
        invoiceId: null,
        invoiceFolio: null,
        invoiceCfdiUuid: null,
        invoiceStatus: null,
        blockReason: "Falta domicilio fiscal del cliente.",
      }),
    ).toBe("Falta domicilio fiscal del cliente.");
  });
});
