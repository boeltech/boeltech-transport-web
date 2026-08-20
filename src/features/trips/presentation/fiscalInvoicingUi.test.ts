import { describe, expect, it } from "vitest";
import { TripStatus } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { getTripInvoicingBadgeConfig, getTripInvoicingBlockReason, toDetailInvoicingBadge } from "./uiHelpers";

describe("getTripInvoicingBadgeConfig", () => {
  it("muestra borrador en viaje programado cuando hay factura ligada (pre-stamp)", () => {
    const cfg = getTripInvoicingBadgeConfig({
      status: TripStatus.SCHEDULED,
      invoicing: tripInvoicingFixture({
        canGenerateInvoice: false,
        invoiceId: "inv-1",
        invoiceStatus: "draft",
      }),
    });
    expect(cfg.label).toBe("Borrador");
  });

  it("muestra facturado con UUID aunque el estado venga vacío pero hasActiveInvoice sea true", () => {
    const cfg = getTripInvoicingBadgeConfig({
      status: TripStatus.IN_PROGRESS,
      invoicing: tripInvoicingFixture({
        hasActiveInvoice: true,
        canGenerateInvoice: false,
        invoiceId: "inv-2",
        invoiceFolio: "A-1",
        invoiceCfdiUuid: "AAAABBBB-CCCC-DDDD-EEEE-FFFFFFFFFFFF",
        invoiceStatus: null,
      }),
    });
    expect(cfg.label).toBe("Facturado");
  });

  it("en viaje sin factura muestra Disponible cuando el API permite generar (pre-stamp)", () => {
    const cfg = getTripInvoicingBadgeConfig({
      status: TripStatus.SCHEDULED,
      invoicing: tripInvoicingFixture({
        canGenerateInvoice: true,
      }),
    });
    expect(cfg.label).toBe("Disponible");
  });
});

describe("toDetailInvoicingBadge", () => {
  it("replaces Disponible / No disponible in the trip detail", () => {
    expect(
      toDetailInvoicingBadge({ label: "Disponible", variant: "outline" }).label,
    ).toBe("Listo para facturar");
    expect(
      toDetailInvoicingBadge({ label: "No disponible", variant: "outline" })
        .label,
    ).toBe("Pendiente");
    expect(
      toDetailInvoicingBadge({ label: "Facturado", variant: "default" }).label,
    ).toBe("Facturado");
  });
});

describe("getTripInvoicingBlockReason", () => {
  it("no devuelve bloqueo del API cuando ya hay borrador ligado", () => {
    expect(
      getTripInvoicingBlockReason(
        tripInvoicingFixture({
          canGenerateInvoice: false,
          invoiceId: "inv-1",
          invoiceFolio: "A-1",
          invoiceStatus: "draft",
          blockReason: "Solo los viajes completados pueden facturarse.",
        }),
      ),
    ).toBeNull();
  });

  it("sí devuelve block_reason cuando no hay factura ligada y no se puede generar", () => {
    expect(
      getTripInvoicingBlockReason(
        tripInvoicingFixture({
          canGenerateInvoice: false,
          blockReason: "Falta domicilio fiscal del cliente.",
        }),
      ),
    ).toBe("Falta domicilio fiscal del cliente.");
  });
});
