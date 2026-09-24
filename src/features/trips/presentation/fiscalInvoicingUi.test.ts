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

  it("ADR-0096: sin_cfdi sin factura muestra Sin CFDI (no Disponible)", () => {
    const cfg = getTripInvoicingBadgeConfig({
      status: TripStatus.SCHEDULED,
      cfdiEmissionIntent: "sin_cfdi_efectivo",
      invoicing: tripInvoicingFixture({
        canGenerateInvoice: false,
        blockReason: "Este viaje se liquida sin CFDI; no se crea ni timbra factura.",
      }),
    });
    expect(cfg.label).toBe("Sin CFDI");
  });

  it("ADR-0096: detalle remapea Sin CFDI sin usar Pendiente", () => {
    expect(
      toDetailInvoicingBadge({ label: "Sin CFDI", variant: "outline" }).label,
    ).toBe("Sin CFDI");
  });

  it("con split activo y porciones pendientes CTA-ready muestra Disponible", () => {
    const cfg = getTripInvoicingBadgeConfig({
      status: TripStatus.COMPLETED,
      invoicing: tripInvoicingFixture({
        canGenerateInvoice: false,
        hasActiveSplit: true,
        splitLegsInvoiced: 0,
        splitLegsTotal: 2,
        canGenerateSplitShareInvoice: true,
      }),
    });
    expect(cfg.label).toBe("Disponible");
    expect(cfg.variant).toBe("outline");
  });

  it("con split activo y algunas porciones facturadas muestra Parcial", () => {
    const cfg = getTripInvoicingBadgeConfig({
      status: TripStatus.COMPLETED,
      invoicing: tripInvoicingFixture({
        canGenerateInvoice: false,
        hasActiveSplit: true,
        splitLegsInvoiced: 1,
        splitLegsTotal: 2,
        canGenerateSplitShareInvoice: true,
      }),
    });
    expect(cfg.label).toBe("Parcial");
    expect(cfg.variant).toBe("secondary");
  });

  it("con split activo y todas las porciones facturadas muestra Facturado", () => {
    const cfg = getTripInvoicingBadgeConfig({
      status: TripStatus.COMPLETED,
      invoicing: tripInvoicingFixture({
        canGenerateInvoice: false,
        hasActiveSplit: true,
        splitLegsInvoiced: 2,
        splitLegsTotal: 2,
        canGenerateSplitShareInvoice: false,
      }),
    });
    expect(cfg.label).toBe("Facturado");
    expect(cfg.variant).toBe("default");
  });

  it("con split activo sin CTA y 0 porciones facturadas muestra No disponible", () => {
    const cfg = getTripInvoicingBadgeConfig({
      status: TripStatus.COMPLETED,
      invoicing: tripInvoicingFixture({
        canGenerateInvoice: false,
        hasActiveSplit: true,
        splitLegsInvoiced: 0,
        splitLegsTotal: 2,
        canGenerateSplitShareInvoice: false,
        blockReason: "Falta domicilio fiscal en la ruta.",
      }),
    });
    expect(cfg.label).toBe("No disponible");
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

  it("remapea Parcial a Facturación en curso en el detalle", () => {
    expect(
      toDetailInvoicingBadge({ label: "Parcial", variant: "secondary" }).label,
    ).toBe("Facturación en curso");
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

  it("no bloquea cuando el CTA de porción split está habilitado", () => {
    expect(
      getTripInvoicingBlockReason(
        tripInvoicingFixture({
          canGenerateInvoice: false,
          hasActiveSplit: true,
          splitLegsInvoiced: 0,
          splitLegsTotal: 2,
          canGenerateSplitShareInvoice: true,
          blockReason: "Este viaje ya tiene una factura activa y no se puede facturar nuevamente.",
        }),
      ),
    ).toBeNull();
  });

  it("no bloquea cuando el prorrateo ya está completo", () => {
    expect(
      getTripInvoicingBlockReason(
        tripInvoicingFixture({
          canGenerateInvoice: false,
          hasActiveSplit: true,
          splitLegsInvoiced: 2,
          splitLegsTotal: 2,
          canGenerateSplitShareInvoice: false,
          blockReason: "Todas las porciones ya tienen factura.",
        }),
      ),
    ).toBeNull();
  });
});
