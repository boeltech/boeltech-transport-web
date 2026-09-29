import { describe, expect, it } from "vitest";

import { tripsListCopy } from "./listCopy";

describe("tripsListCopy", () => {
  it("usa copy operativo en CTAs y filtros del listado", () => {
    expect(tripsListCopy.actions.create).toBe("Reservar viaje");
    expect(tripsListCopy.actions.viewDrafts).toBe("Ver reservas");
    expect(tripsListCopy.filter.overdue).toBe("Con retraso");
    expect(tripsListCopy.filter.showFilters).toBe("Filtros");
    expect(tripsListCopy.filter.originBranchLabel).toBe("Sucursal origen");
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
    expect(tripsListCopy.page.descriptionClient).toMatch(/Mis facturas/i);
    expect(tripsListCopy.page.descriptionClient).not.toMatch(/flota/i);
    expect(tripsListCopy.filter.searchPlaceholderClient).toBeDefined();
    expect(tripsListCopy.empty.noDataDescriptionClient).toMatch(/asignen/i);
    expect(tripsListCopy.empty.noDataDescriptionClient).not.toMatch(
      /Reservar|Confirmar|Iniciar/i,
    );
    expect(tripsListCopy.clientOrientation.body).toMatch(/envíos/i);
    expect(tripsListCopy.clientOrientation.body).toMatch(/Mis facturas/i);
    expect(tripsListCopy.clientOrientation.body).not.toMatch(
      /Iniciar|Completar|Reservar|falso|Dinero del viaje|Costos/i,
    );
    expect(tripsListCopy.workbench.bucketDescriptions.scheduledClient).not.toMatch(
      /listos para iniciar/i,
    );
    expect(tripsListCopy.workbench.bucketDescriptions.inProgressClient).toMatch(
      /en camino/i,
    );
  });

  it("tiene copy operativo para portal conductor", () => {
    expect(tripsListCopy.page.titleDriver).toBe("Mis viajes");
    expect(tripsListCopy.page.descriptionDriver).toMatch(/Inicia/i);
    expect(tripsListCopy.page.descriptionDriver).toMatch(/paradas/i);
    expect(tripsListCopy.page.descriptionDriver).toMatch(/completa/i);
    expect(tripsListCopy.page.descriptionDriver).not.toMatch(/flota/i);
    expect(tripsListCopy.page.descriptionDriver).not.toMatch(/factura/i);
    expect(tripsListCopy.page.descriptionDriver).not.toBe(
      tripsListCopy.page.descriptionDispatcher,
    );
    expect(tripsListCopy.page.descriptionDriver).not.toBe(
      tripsListCopy.page.descriptionOperator,
    );
    expect(tripsListCopy.empty.noDataDescriptionDriver).toMatch(/asignen/i);
    expect(tripsListCopy.empty.noDataDescriptionDriver).not.toMatch(
      /Reservar|Confirmar|Iniciar/i,
    );
    expect(tripsListCopy.empty.noDataDescription).toMatch(/reservando/i);
    expect(tripsListCopy.filter.searchPlaceholderDriver).toBeDefined();
    expect(tripsListCopy.driverOrientation.body).toMatch(/Iniciar/i);
    expect(tripsListCopy.driverOrientation.body).toMatch(/paradas/i);
    expect(tripsListCopy.driverOrientation.body).toMatch(/Completar/i);
    expect(tripsListCopy.driverOrientation.body).not.toMatch(
      /Reservar|falso|Dinero del viaje|Costos|Por facturar/i,
    );
  });

  it("describe lectura fiscal para accountant, sin patio ni strip de 4 pasos", () => {
    expect(tripsListCopy.page.descriptionAccountant).toMatch(/facturar/i);
    expect(tripsListCopy.page.descriptionAccountant).toMatch(/Por facturar/i);
    expect(tripsListCopy.page.descriptionAccountant).not.toMatch(
      /administra tu flota/i,
    );
    expect(tripsListCopy.page.descriptionAccountant).not.toMatch(/Reserva/i);
    expect(tripsListCopy.accountantOrientation.body).toMatch(/Por facturar/i);
    expect(tripsListCopy.accountantOrientation.body).toMatch(/Atención fiscal/i);
    expect(tripsListCopy.accountantOrientation.body).not.toMatch(/Reservar/i);
    expect(
      tripsListCopy.workbench.bucketDescriptions.fiscalAttentionAccountant,
    ).toMatch(/ya hay cfdi/i);
    expect(
      tripsListCopy.workbench.bucketDescriptions.fiscalAttentionAccountant,
    ).not.toMatch(/avisar a facturación/i);
  });

  it("describe recepción SAT para manager, sin flota ni copy de accountant", () => {
    expect(tripsListCopy.page.descriptionManager).toMatch(/Atención fiscal/i);
    expect(tripsListCopy.page.descriptionManager).toMatch(
      /cancelar o sustituir/i,
    );
    expect(tripsListCopy.page.descriptionManager).not.toMatch(/flota/i);
    expect(tripsListCopy.page.descriptionManager).not.toMatch(/Reserva/i);
    expect(tripsListCopy.page.descriptionManager).not.toMatch(
      /pídelo a un gerente|pide a un gerente/i,
    );
    expect(tripsListCopy.managerOrientation.body).toMatch(/tú sustituyes/i);
    expect(tripsListCopy.managerOrientation.body).not.toMatch(
      /no sustituyes tú/i,
    );
    expect(tripsListCopy.managerOrientation.body).not.toMatch(/dos colas/i);
    expect(tripsListCopy.managerOrientation.body).not.toMatch(
      /pide a un gerente/i,
    );
    expect(
      tripsListCopy.workbench.bucketDescriptions.fiscalAttentionManager,
    ).toMatch(/tú sustituyes o cancelas/i);
    expect(
      tripsListCopy.workbench.bucketDescriptions.fiscalAttentionManager,
    ).not.toMatch(/avisar a facturación|pide a un gerente|no sustituyes/i);
    expect(tripsListCopy.empty.fiscalAttentionManagerDescription).toMatch(
      /cola vacía es correcta/i,
    );
  });

  it("describe gastos en Costos para operator, sin flota ni hermanos", () => {
    expect(tripsListCopy.page.descriptionOperator).toMatch(/\bCostos\b/);
    expect(tripsListCopy.page.descriptionOperator).toMatch(/gastos/i);
    expect(tripsListCopy.page.descriptionOperator).not.toMatch(/flota/i);
    expect(tripsListCopy.page.descriptionOperator).not.toMatch(/Reserva/i);
    expect(tripsListCopy.page.descriptionOperator).not.toMatch(
      /Por facturar|Atención fiscal|SAT/i,
    );
    expect(tripsListCopy.operatorOrientation.body).toMatch(/\bCostos\b/);
    expect(tripsListCopy.operatorOrientation.body).toMatch(/Agregar de ruta/i);
    expect(tripsListCopy.operatorOrientation.body).not.toMatch(
      /Reservar el viaje|Por facturar|Atención fiscal/i,
    );
    expect(tripsListCopy.empty.noDataDescriptionOperator).toMatch(
      /\bCostos\b/,
    );
    expect(tripsListCopy.empty.noDataDescriptionOperator).not.toMatch(
      /Reservar|Confirmar|Iniciar/i,
    );
  });

  it("describe el job del día para dispatcher, no administrar flota", () => {
    expect(tripsListCopy.page.descriptionDispatcher).toMatch(/reserva/i);
    expect(tripsListCopy.page.descriptionDispatcher).toMatch(/inicia/i);
    expect(tripsListCopy.page.descriptionDispatcher).not.toMatch(/administra/i);
    expect(tripsListCopy.page.descriptionDispatcher).not.toMatch(/flota/i);
  });

  it("relato de 4 pasos Reservar → completar → confirmar → iniciar", () => {
    expect(tripsListCopy.orientation.steps).toHaveLength(4);
    expect(tripsListCopy.orientation.steps[0]).toMatch(/Reservar/i);
    expect(tripsListCopy.orientation.steps[1]).toMatch(/ruta y cargas/i);
    expect(tripsListCopy.orientation.steps[2]).toMatch(/Confirmar/i);
    expect(tripsListCopy.orientation.steps[3]).toMatch(/Iniciar/i);
    expect(tripsListCopy.empty.jobLead).toMatch(/viaje/i);
    expect(tripsListCopy.empty.filteredDescription).toMatch(/filtros/i);
    expect(tripsListCopy.empty.filteredDescription).not.toMatch(/Reservar/i);
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
      workbench: tripsListCopy.workbench,
    });
    expect(visible).not.toMatch(/Sin finalizar/);
    expect(visible).not.toMatch(/Situación fiscal/);
    expect(visible).not.toMatch(/\bTimbrada\b/);
    expect(visible).not.toMatch(/Pend\. cancelación SAT/);
    expect(visible).not.toMatch(/"Fiscal"/);
    expect(visible).not.toMatch(/Alta con cotización/);
    expect(visible).not.toMatch(/Alta completa/);
    expect(visible).not.toMatch(/facturable/i);
  });

  it("incluye Parcial para badge de prorrateo multi-RFC (ADR-0081)", () => {
    expect(tripsListCopy.invoicingBadge.partial).toBe("Parcial");
  });

  it("describe Atención fiscal como cola de revisión/sustitución en la misma lista", () => {
    expect(tripsListCopy.workbench.buckets.fiscalAttention).toBe(
      "Atención fiscal",
    );
    expect(tripsListCopy.workbench.bucketDescriptions.fiscalAttention).toMatch(
      /sustitución/i,
    );
    expect(tripsListCopy.workbench.bucketDescriptions.fiscalAttention).toMatch(
      /no es la cola por facturar/i,
    );
    expect(tripsListCopy.workbench.bucketDescriptions.fiscalAttention).not.toMatch(
      /facturable/i,
    );
    expect(
      tripsListCopy.workbench.bucketDescriptions.fiscalAttentionEscalate,
    ).toMatch(/avisar a facturación/i);
    expect(
      tripsListCopy.workbench.bucketDescriptions.fiscalAttentionEscalate,
    ).not.toMatch(/sustitución/i);
  });

  it("incluye cliente en el placeholder porque el API search lo cubre", () => {
    expect(tripsListCopy.filter.searchPlaceholder).toBe(
      "Código, cliente o ruta",
    );
  });
});
