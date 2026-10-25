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
  });

  it("Gastos = gasto de viaje; resolución del gráfico; sin comisión en copy de alcance", () => {
    expect(financeCopy.expenses.metrics.totalExpense).toMatch(/Gasto de viaje/);
    expect(financeCopy.expenses.filters.granularity).toBe(
      "Resolución del gráfico",
    );
    expect(financeCopy.expenses.alert.summary).toMatch(/gasto de viaje/i);
    expect(financeCopy.expenses.alert.summary).toMatch(/comisión/i);
    expect(financeCopy.expenses.charts.latestPeriod.description).toMatch(
      /último tramo/i,
    );
    expect(financeCopy.expenses.empty.viewPerformance).toMatch(/mes a mes/i);
  });

  it("subtítulo de Análisis no reduce todo a «gasto»", () => {
    const subtitle = financeCopy.page.sections.analysis.subtitle;
    expect(subtitle).toMatch(/margen operativo/i);
    expect(subtitle).toMatch(/gasto de viaje/i);
    expect(subtitle.toLowerCase().endsWith("gasto.")).toBe(false);
  });
});

