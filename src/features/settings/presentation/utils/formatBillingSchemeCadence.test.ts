import { describe, expect, it } from "vitest";
import type { BillingScheme } from "../../domain/billingScheme.types";
import {
  formatBillingSchemeCadenceSummary,
  formatBillingSchemeParamsSummary,
} from "./formatBillingSchemeCadence";

function scheme(
  partial: Pick<BillingScheme, "cadenceKind" | "params">,
): BillingScheme {
  return {
    id: "s1",
    tenantId: "t1",
    name: "Test",
    isDefault: false,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("formatBillingSchemeCadenceSummary", () => {
  it("resume por cierre de viaje con horas operativas", () => {
    const s = scheme({
      cadenceKind: "event",
      params: { windowHours: 48 },
    });
    expect(formatBillingSchemeParamsSummary(s)).toBe("48 h tras cerrar viaje");
    expect(formatBillingSchemeCadenceSummary(s)).toBe(
      "Por cierre de viaje · 48 h tras cerrar viaje",
    );
  });

  it("resume semanal con días de corte", () => {
    const s = scheme({
      cadenceKind: "periodic_weekly",
      params: { weekdays: [4, 5] },
    });
    expect(formatBillingSchemeCadenceSummary(s)).toBe("Semanal · Jue, Vie");
  });

  it("resume cortes del mes sin jerga decenal", () => {
    const s = scheme({
      cadenceKind: "periodic_decadal",
      params: { monthDays: [10, 20, 30] },
    });
    expect(formatBillingSchemeCadenceSummary(s)).toBe(
      "Cortes del mes · Días 10, 20, 30",
    );
  });

  it("resume mensual por día hábil", () => {
    const s = scheme({
      cadenceKind: "periodic_monthly",
      params: { businessDaysFromMonthStart: 3 },
    });
    expect(formatBillingSchemeCadenceSummary(s)).toBe(
      "Mensual · 3.º día hábil del mes",
    );
  });
});
