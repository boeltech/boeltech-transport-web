import { describe, expect, it } from "vitest";
import type { BillingScheme } from "../../domain/billingScheme.types";
import {
  formatBillingSchemeCadenceSummary,
  formatBillingSchemeNaturalDescription,
  formatBillingSchemePeriodExample,
  formatBillingSchemePeriodRuleBullets,
  formatDecadalPeriodParts,
} from "./formatBillingSchemeCadence";
import { formatBillingSchemeParamsSummary } from "./formatBillingSchemeCadenceParams";

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

describe("formatBillingSchemeNaturalDescription", () => {
  it("describe evento por cierre de viaje", () => {
    const s = scheme({
      cadenceKind: "event",
      params: { windowHours: 48 },
    });
    expect(formatBillingSchemeNaturalDescription(s)).toContain("48 horas");
    expect(formatBillingSchemeNaturalDescription(s)).toContain("cierra");
  });

  it("describe semanal en lenguaje natural", () => {
    const s = scheme({
      cadenceKind: "periodic_weekly",
      params: { weekdays: [4, 5] },
    });
    expect(formatBillingSchemeNaturalDescription(s)).toContain("Jue");
    expect(formatBillingSchemeNaturalDescription(s)).toContain("Vie");
    expect(formatBillingSchemeNaturalDescription(s)).toContain("correo");
  });

  it("describe cortes del mes", () => {
    const s = scheme({
      cadenceKind: "periodic_decadal",
      params: { monthDays: [10, 20, 30] },
    });
    expect(formatBillingSchemeNaturalDescription(s)).toContain("10, 20, 30");
  });

  it("describe mensual por día hábil", () => {
    const s = scheme({
      cadenceKind: "periodic_monthly",
      params: { businessDaysFromMonthStart: 3 },
    });
    expect(formatBillingSchemeNaturalDescription(s)).toContain("3.º día hábil");
  });

  it("describe mensual por días calendario", () => {
    const s = scheme({
      cadenceKind: "periodic_monthly",
      params: { monthDays: [1, 15] },
    });
    expect(formatBillingSchemeNaturalDescription(s)).toContain("1, 15");
  });
});

describe("formatBillingSchemePeriodRuleBullets", () => {
  it("incluye frecuencia y regla de viajes para semanal", () => {
    const s = scheme({
      cadenceKind: "periodic_weekly",
      params: { weekdays: [4, 5] },
    });
    const bullets = formatBillingSchemePeriodRuleBullets(s);
    expect(bullets[0]).toBe("Frecuencia: Semanal");
    expect(bullets.some((b) => b.includes("Jue"))).toBe(true);
    expect(bullets.at(-1)).toContain("cierre operativo");
  });
});

describe("formatBillingSchemePeriodExample", () => {
  it("explica evento sin periodo fijo", () => {
    const s = scheme({
      cadenceKind: "event",
      params: { windowHours: 48 },
    });
    const text = formatBillingSchemePeriodExample(s);
    expect(text).toContain("48 horas");
    expect(text).toContain("No hay periodo fijo");
  });

  it("explica semanal con días largos y último corte", () => {
    const s = scheme({
      cadenceKind: "periodic_weekly",
      params: { weekdays: [4, 5] },
    });
    const text = formatBillingSchemePeriodExample(s);
    expect(text).toContain("jueves");
    expect(text).toContain("viernes");
    expect(text).toContain("último corte");
  });

  it("explica cortes del mes con rangos didácticos", () => {
    expect(formatDecadalPeriodParts([10, 20, 30])).toContain(
      "del 1 al 10",
    );
    expect(formatDecadalPeriodParts([10, 20, 30])).toContain(
      "del 11 al 20",
    );
    expect(formatDecadalPeriodParts([10, 20, 30])).toContain(
      "a fin de mes",
    );

    const s = scheme({
      cadenceKind: "periodic_decadal",
      params: { monthDays: [10, 20, 30] },
    });
    expect(formatBillingSchemePeriodExample(s)).toContain("día 10");
  });

  it("explica mensual de un solo día calendario", () => {
    const s = scheme({
      cadenceKind: "periodic_monthly",
      params: { monthDays: [15] },
    });
    const text = formatBillingSchemePeriodExample(s);
    expect(text).toContain("día 15");
    expect(text).toContain("del 1 al 15");
  });

  it("explica mensual por día hábil", () => {
    const s = scheme({
      cadenceKind: "periodic_monthly",
      params: { businessDaysFromMonthStart: 3 },
    });
    expect(formatBillingSchemePeriodExample(s)).toContain("3.º día hábil");
  });
});
