import { describe, expect, it } from "vitest";

import { settlementsCopy } from "./settlementsCopy";

describe("settlementsCopy — F1 tres bolsillos", () => {
  it("empty Anticipos explica job, descuento y CTA Registrar anticipo", () => {
    expect(settlementsCopy.empty.advancesTitle).toMatch(/anticipo/i);
    expect(settlementsCopy.empty.advances).toMatch(/efectivo adelantado/i);
    expect(settlementsCopy.empty.advances).toMatch(/descuenta/i);
    expect(settlementsCopy.empty.advances).toMatch(/Registrar anticipo/i);
    expect(settlementsCopy.empty.advances).toMatch(/Costos/i);
    expect(settlementsCopy.empty.advances).not.toMatch(/\bviáticos\b/i);
  });

  it("dialog anticipo: descuento + no duplicar en Costos", () => {
    const description = settlementsCopy.advancesDialog.description;
    expect(description).toMatch(/descuenta/i);
    expect(description).toMatch(/Costos/i);
    expect(description).toMatch(/gasto del viaje/i);
    expect(description).not.toMatch(/\bviáticos\b/i);
    expect(settlementsCopy.advancesDialog.tripLabel).toBe("Viaje (opcional)");
    expect(settlementsCopy.advancesDialog.tripNone).toMatch(/cuenta del operador/i);
    expect(settlementsCopy.advanceFlow.fieldLabels.tripId).toBe("Viaje");
    expect(settlementsCopy.advanceFlow.editSheet.materialFields).toMatch(/viaje/i);
  });

  it("create settlement franja enseña los 3 canales y anti-Costos", () => {
    const { summary } = settlementsCopy.createPage;
    expect(summary.channelsTeachingExpense).toMatch(/Gasto del viaje/i);
    expect(summary.channelsTeachingExpense).toMatch(/Costos/i);
    expect(summary.channelsTeachingExpense).toMatch(/reembolso/i);
    expect(summary.channelsTeachingAdvance).toMatch(/Anticipo/i);
    expect(summary.channelsTeachingAdvance).toMatch(/descuento/i);
    expect(summary.channelsTeachingFixed).toMatch(/Pago fijo de tarifa/i);
    expect(summary.channelsTeachingFixed).toMatch(/1×/i);
    expect(summary.channelsTeachingFixed).not.toMatch(/corte/i);
    expect(summary.commercialFreightHint).not.toMatch(/CFDI/i);
    expect(summary.channelsTeachingIntro).toMatch(/no registres el mismo dinero/i);
  });

  it("detalle: deducciones no igualan viáticos con anticipos", () => {
    expect(settlementsCopy.detailPage.items.deductionsSubtitle).toMatch(/Anticipos/i);
    expect(settlementsCopy.detailPage.items.deductionsSubtitle).toMatch(/deducciones/i);
    expect(settlementsCopy.detailPage.items.deductionsSubtitle).not.toMatch(
      /\bviáticos\b/i,
    );
  });
});

describe("settlementsCopy — F2 clase de ruta", () => {
  it("campo y glosario alineados a Clase de ruta", () => {
    expect(settlementsCopy.agreementsDialog.routeTypeLabel).toBe("Clase de ruta");
    expect(settlementsCopy.agreementsDialog.routesSectionTitle).toMatch(
      /clase de ruta/i,
    );
    expect(settlementsCopy.agreementsDialog.routesSectionDescription).toMatch(
      /Transfer \/ Patio/i,
    );
    expect(settlementsCopy.agreementsDialog.routesSectionDescription).toMatch(
      /despachar el viaje/i,
    );
    expect(JSON.stringify(settlementsCopy)).not.toMatch(/Movimiento local/);
    expect(settlementsCopy.agreementsDialog.routeTypeLabel).not.toBe(
      "Tipo de viaje",
    );
  });
});

describe("settlementsCopy — banner sin tarifa / incompleta", () => {
  it("missing apunta a Tarifas y no a ficha de empleado", () => {
    const { empty } = settlementsCopy.createPage;
    expect(empty.missingSchemeTitle).toBe("Sin tarifa asignada");
    expect(empty.missingSchemeDescription).toMatch(/tarifa vigente/i);
    expect(empty.missingSchemeDescription).toMatch(/Tarifas/i);
    expect(empty.configureCompensationAction).toBe("Ir a Tarifas");
    expect(empty.configureEmployeeSalaryAction).toBe("Configurar sueldo en empleado");
  });

  it("incomplete diferencia completar tarifa vs sueldo en empleado", () => {
    const { empty } = settlementsCopy.createPage;
    expect(empty.incompleteAgreementTitle).toBe("Tarifa incompleta");
    expect(empty.incompleteAgreementDescription).toMatch(/reglas o prestaciones/i);
    expect(empty.incompleteAgreementDescription).toMatch(/sueldo base/i);
    expect(empty.configureIncompleteCompensationAction).toBe("Completar tarifa");
  });
});

describe("settlementsCopy — period_overlap status variants (F3)", () => {
  it("exposes fallback, in-progress and disbursed badge/tooltip strings", () => {
    const { warnings } = settlementsCopy.workbench;
    expect(warnings.period_overlap).toBe("Ya hay un pago en este período");
    expect(warnings.period_overlap_in_progress).toBe(
      "Ya hay un pago en curso en este período",
    );
    expect(warnings.period_overlap_disbursed).toBe(
      "Ya hay un pago registrado en este período",
    );
    expect(warnings.period_overlap_tooltip).toMatch(/registrado o en curso/i);
    expect(warnings.period_overlap_tooltip_in_progress).toMatch(
      /registrado o en curso/i,
    );
    expect(warnings.period_overlap_tooltip_disbursed).toMatch(/registrado/i);
    expect(warnings.period_overlap_tooltip_disbursed).not.toMatch(/liquidado/i);
    expect(warnings.period_overlap_tooltip_disbursed).not.toMatch(/en curso/i);
  });
});

describe("settlementsCopy — badges viaje en falso / prorrateo", () => {
  it("chips alineados a detalle viaje y facturación", () => {
    const { trips } = settlementsCopy.createPage;
    expect(trips.falseTripBadge).toBe("Viaje en falso");
    expect(trips.revenueSplitBadge).toBe("Prorrateo");
    expect(trips.revenueSplitBadgeTitle).toBe("Flete prorrateado");
    expect(trips.revenueSplitBadge).not.toMatch(/split/i);
  });

  it("badge Varios operadores con copy de comisión completa por regla", () => {
    const { trips } = settlementsCopy.createPage;
    expect(trips.multipleOperatorsBadge).toBe("Varios operadores");
    expect(trips.multipleOperatorsBadgeTitle).toBe(
      "Participaron varios operadores. Cada uno recibe el 100 % de la comisión según su regla.",
    );
    expect(trips).not.toHaveProperty("midTripShareLabel");
    expect(trips).not.toHaveProperty("midTripShareTooltip");
  });
});
