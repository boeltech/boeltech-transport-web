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
    expect(financeCopy.performance.scopeNoteDetail).not.toMatch(
      /P&L contable|caja/i,
    );
    expect(financeCopy.performance.operationalCostLegend).toMatch(
      /gasto de viaje aprobado/i,
    );
    expect(financeCopy.performance.operationalCostLegend).toMatch(
      /comisión de liquidación autorizada/i,
    );
  });

  it("Gastos = gasto de viaje; resolución del gráfico; sin comisión en copy de alcance", () => {
    expect(financeCopy.expenses.metrics.totalExpense).toMatch(/Gasto de viaje/);
    expect(financeCopy.expenses.filters.granularity).toBe(
      "Resolución del gráfico",
    );
    expect(financeCopy.expenses.alert.summary).toMatch(/gasto de viaje/i);
    expect(financeCopy.expenses.alert.summary).toMatch(/comisión/i);
    expect(financeCopy.expenses.alert.includesShow).toMatch(
      /qué incluye esta vista/i,
    );
    expect(financeCopy.expenses.charts.latestPeriod.description).toMatch(
      /último tramo/i,
    );
    expect(financeCopy.expenses.charts.timeSeries.ariaLabel).toMatch(
      /barras apiladas/i,
    );
    expect(financeCopy.expenses.charts.latestPeriod.ariaLabel).toMatch(
      /dona/i,
    );
    expect(financeCopy.expenses.empty.viewPerformance).toMatch(/mes a mes/i);
    expect(financeCopy.expenses.table.viewDriver("Ana")).toMatch(
      /detalle del operador Ana/i,
    );
    expect(financeCopy.expenses.table.viewClient("Acme")).toMatch(
      /detalle del cliente Acme/i,
    );
  });


  it("subtítulo de Análisis es orientador (no listado técnico)", () => {
    const subtitle = financeCopy.page.sections.analysis.subtitle;
    expect(subtitle).toMatch(/rentabilidad/i);
    expect(subtitle).toMatch(/tendencia/i);
    expect(subtitle).toMatch(/gastos/i);
    expect(subtitle).not.toMatch(/cliente\/ruta|unidad\/operador/i);
    expect(subtitle.split(/\s+/).length).toBeLessThanOrEqual(15);
  });

  it("Cartera F1: gasto de viaje, DSO/Vencido proxy 30d, bases IVA", () => {
    expect(financeCopy.kpis.expensesThisMonth.title).toBe(
      "Gasto de viaje del mes",
    );
    expect(financeCopy.kpis.expensesThisMonth.description).toMatch(
      /Análisis.*Gastos/i,
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

  it("Cartera F2 Pulse: Ingreso/Margen operativo y línea no-P&L", () => {
    expect(financeCopy.pulse.revenue.title).toBe("Ingreso");
    expect(financeCopy.pulse.operationalMargin.title).toBe("Margen operativo");
    expect(financeCopy.pulse.basisLine).toMatch(/base operativa/i);
    expect(financeCopy.pulse.basisLine).toMatch(/no es P&L/i);
    expect(financeCopy.pulse.ctaMonthOverMonth).toMatch(/mes a mes/i);
    expect(financeCopy.pulse.revenue.description).toMatch(/subtotal|tarifa/i);
    expect(financeCopy.pulse.receivable.description).toMatch(/total CFDI/i);
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


