import { describe, expect, it } from "vitest";

import { tripsListCopy } from "./listCopy";

describe("tripsListCopy", () => {
  it("usa copy operativo en CTAs y filtros del listado", () => {
    expect(tripsListCopy.actions.create).toBe("Reservar viaje");
    expect(tripsListCopy.actions.viewDrafts).toBe("Ver reservas");
    expect(tripsListCopy.filter.overdue).toBe("Con retraso");
    expect(tripsListCopy.filter.fiscalLabel).toBe("Atención de factura");
    expect(tripsListCopy.filter.fiscalAttention).toBe("Solo con atención");
    expect(tripsListCopy.invoiceStatus.stamped).toBe("Facturado");
    expect(tripsListCopy.invoiceStatus.cancellation_pending).toBe(
      "Cancelación en proceso",
    );
    expect(tripsListCopy.badge.fiscalAttention).toBe("Requiere atención");
  });

  it("tiene copy de consulta para portal cliente", () => {
    expect(tripsListCopy.page.titleClient).toBe("Mis envíos");
    expect(tripsListCopy.page.descriptionClient).toMatch(/envíos/i);
    expect(tripsListCopy.page.descriptionClient).not.toMatch(/flota/i);
    expect(tripsListCopy.filter.searchPlaceholderClient).toBeDefined();
  });

  it("tiene copy operativo para portal conductor", () => {
    expect(tripsListCopy.page.titleDriver).toBe("Mis viajes");
    expect(tripsListCopy.page.descriptionDriver).toMatch(/viajes/i);
    expect(tripsListCopy.page.descriptionDriver).not.toMatch(/flota/i);
    expect(tripsListCopy.page.descriptionDriver).not.toMatch(/factura/i);
    expect(tripsListCopy.empty.noDataDescriptionDriver).toMatch(/asignen/i);
    expect(tripsListCopy.empty.noDataDescription).toMatch(/reservando/i);
    expect(tripsListCopy.filter.searchPlaceholderDriver).toBeDefined();
  });

  it("no promete motor de cotizaciones en CTAs del listado", () => {
    const ctaCopy = JSON.stringify({
      actions: {
        create: tripsListCopy.actions.create,
        viewDrafts: tripsListCopy.actions.viewDrafts,
      },
      reserve: tripsListCopy.reserve,
    });
    expect(ctaCopy).not.toMatch(/cotizaci[oó]n/i);
  });

  it("no usa léxico legado en cadenas del listado", () => {
    const visible = JSON.stringify({
      actions: tripsListCopy.actions,
      filter: tripsListCopy.filter,
      chip: tripsListCopy.chip,
      invoiceStatus: tripsListCopy.invoiceStatus,
      badge: tripsListCopy.badge,
      invoicingBadge: tripsListCopy.invoicingBadge,
      banner: tripsListCopy.banner,
    });
    expect(visible).not.toMatch(/Sin finalizar/);
    expect(visible).not.toMatch(/Situación fiscal/);
    expect(visible).not.toMatch(/\bTimbrada\b/);
    expect(visible).not.toMatch(/Pend\. cancelación SAT/);
    expect(visible).not.toMatch(/"Fiscal"/);
    expect(visible).not.toMatch(/Alta con cotización/);
    expect(visible).not.toMatch(/Alta completa/);
  });

  it("incluye cliente en el placeholder porque el API search lo cubre", () => {
    expect(tripsListCopy.filter.searchPlaceholder.toLowerCase()).toContain(
      "cliente",
    );
  });
});
