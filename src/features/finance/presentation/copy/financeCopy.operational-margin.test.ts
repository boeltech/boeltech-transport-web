import { describe, expect, it } from "vitest";
import { financeCopy } from "./financeCopy";

describe("financeCopy — ADR-0108 margen operativo (glosario PRD)", () => {
  it("Rentabilidad usa Costo/Margen operativo y chip de comisión", () => {
    expect(financeCopy.profitability.metrics.operationalCost).toBe(
      "Costo operativo",
    );
    expect(financeCopy.profitability.metrics.operationalMargin).toBe(
      "Margen operativo",
    );
    expect(financeCopy.profitability.missingCommissionChip).toMatch(
      /Sin comisión liquidada aún/,
    );
    expect(financeCopy.profitability.metrics.totalActual).not.toMatch(
      /Gasto real/i,
    );
  });

  it("Mes a mes nombra costo operativo y personal aparte", () => {
    expect(financeCopy.performance.kpis.cost).toBe("Costo operativo");
    expect(financeCopy.performance.kpis.personnelCost).toBe("Costo de personal");
    expect(financeCopy.performance.table.personnelCost).toBe("Costo de personal");
    expect(financeCopy.performance.scopeNote).not.toMatch(/P&L contable|caja/i);
    expect(financeCopy.performance.scopeNoteDetail).toHaveLength(4);
    expect(financeCopy.performance.scopeNoteDetail.join("\n")).not.toMatch(
      /P&L contable|caja/i,
    );
    expect(financeCopy.performance.scopeNoteDetail[0]).toMatch(/^Ingreso:/);
    expect(financeCopy.performance.scopeNoteDetail[1]).toMatch(
      /^Costo operativo:/,
    );
    expect(financeCopy.performance.scopeNoteDetail[2]).toMatch(
      /costo de personal/i,
    );
    expect(financeCopy.performance.scopeNoteDetail[3]).toMatch(
      /Gasto de viaje/i,
    );
    expect(financeCopy.performance.operationalCostLegend).toMatch(
      /gasto de viaje aprobado/i,
    );
    expect(financeCopy.performance.operationalCostLegend).toMatch(
      /comisión de liquidación autorizada/i,
    );
  });

  it("Gasto de viaje: KPI corto, ranking del periodo, CTAs Tendencia/Margen", () => {
    expect(financeCopy.expenses.metrics.totalExpense).toBe("Gasto de viaje");
    expect(financeCopy.expenses.filters.granularity).toBe(
      "Resolución del gráfico",
    );
    expect(financeCopy.expenses.alert.summary).toMatch(/gasto de viaje/i);
    expect(financeCopy.expenses.alert.summary).toMatch(/comisión/i);
    expect(financeCopy.expenses.alert.includesShow).toMatch(
      /qué incluye esta vista/i,
    );
    expect(financeCopy.expenses.alert.goToProfitability).toMatch(/margen/i);
    expect(financeCopy.expenses.charts.composition.description).toMatch(
      /periodo/i,
    );
    expect(financeCopy.expenses.charts.composition.description).not.toMatch(
      /tramo/i,
    );
    expect(financeCopy.expenses.charts.timeSeries.ariaLabel).toMatch(
      /barras apiladas/i,
    );
    expect(financeCopy.expenses.charts.composition.ariaLabel).toMatch(
      /ranking/i,
    );
    expect(financeCopy.expenses.charts.timeSeries.footer(1, 2)).not.toMatch(
      /tramo/i,
    );
    expect(financeCopy.expenses.empty.viewPerformance).toMatch(/tendencia/i);
    expect(financeCopy.expenses.table.viewDriver("Ana")).toMatch(
      /detalle del operador Ana/i,
    );
    expect(financeCopy.expenses.table.viewClient("Acme")).toMatch(
      /detalle del cliente Acme/i,
    );
  });


  it("subtítulo de Análisis es orientador (no listado técnico)", () => {
    const subtitle = financeCopy.page.sections.analysis.subtitle;
    expect(subtitle).toMatch(/tendencia/i);
    expect(subtitle).toMatch(/margen/i);
    expect(subtitle).toMatch(/gasto de viaje/i);
    expect(subtitle).not.toMatch(/cliente\/ruta|unidad\/operador/i);
    expect(subtitle.split(/\s+/).length).toBeLessThanOrEqual(15);
  });

  it("tab Margen (URL view=margin) y alert Gasto sin «Por dimensión»", () => {
    expect(financeCopy.page.analysisViews.margin).toBe("Margen");
    expect(financeCopy.expenses.alert.summary).toMatch(/Margen/);
    expect(financeCopy.expenses.alert.summary).not.toMatch(/Por dimensión/);
  });

  it("Cartera F1: gasto de viaje, DSO/Vencido proxy 30d, bases IVA", () => {
    expect(financeCopy.kpis.expensesThisMonth.title).toBe(
      "Gasto de viaje del mes",
    );
    expect(financeCopy.kpis.expensesThisMonth.description).toMatch(
      /Análisis.*Gasto de viaje/i,
    );
    expect(financeCopy.kpis.expensesThisMonth.description).toMatch(
      /sin comisión/i,
    );
    expect(financeCopy.kpis.totalOverdue.description).toMatch(/estimación/i);
    expect(financeCopy.kpis.totalOverdue.description).toMatch(/30/);
    expect(financeCopy.kpis.totalOverdue.description).not.toMatch(
      /credit_days|crédito pactado por cliente.*real/i,
    );
    expect(financeCopy.summary.dsoTitle).toMatch(/estimación/i);
    expect(financeCopy.summary.dsoTitle).toMatch(/cartera/i);
    expect(financeCopy.summary.dsoTitle).toMatch(/×\s*30|x\s*30|×30/i);
    expect(financeCopy.kpis.totalReceivable.description).toMatch(/total CFDI/i);
    expect(financeCopy.kpis.totalReceivable.description).toMatch(
      /subtotal|tarifa/i,
    );
    expect(financeCopy.page.hub.orientation).toMatch(/PPD/i);
    expect(financeCopy.page.hub.orientation).toMatch(/cartera en cero/i);
  });

  it("Cartera F2 Pulse: Ingreso/Margen operativo y leyenda de bases", () => {
    expect(financeCopy.pulse.revenue.title).toBe("Ingreso");
    expect(financeCopy.pulse.operationalMargin.title).toBe("Margen operativo");
    expect(financeCopy.pulse.basisLine).toMatch(/operativo/i);
    expect(financeCopy.pulse.basisLine).toMatch(/subtotal|tarifa/i);
    expect(financeCopy.pulse.basisLine).toMatch(/total CFDI/i);
    expect(financeCopy.pulse.basisLine).toMatch(/no es P&L/i);
    expect(financeCopy.pulse.ctaMonthOverMonth).toMatch(/mes a mes/i);
    expect(financeCopy.pulse.revenue.description).toMatch(/subtotal|tarifa/i);
    expect(financeCopy.pulse.receivable.description).toMatch(/total CFDI/i);
    // Subtítulos cortos: sin espejo mutuo Ingreso↔Por cobrar
    expect(financeCopy.pulse.revenue.description).not.toMatch(/por cobrar/i);
    expect(financeCopy.pulse.receivable.description).not.toMatch(
      /subtotal|tarifa|ingreso operativo/i,
    );
  });

  it("Análisis F4: caption sticky une periodo + base operativa · no es P&L", () => {
    const line = financeCopy.analysisPeriod.stickyLine(
      "Periodo: oct 2025 a sep 2026 · 12 meses completos",
    );
    expect(line).toMatch(/^Periodo:/i);
    expect(line).toContain(financeCopy.pulse.basisLine);
    expect(financeCopy.analysisPeriod.stickyAriaLabel).toMatch(/alcance/i);
  });
});


