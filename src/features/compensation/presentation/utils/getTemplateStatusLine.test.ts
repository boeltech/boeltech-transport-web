import { describe, expect, it } from "vitest";
import { getFamilySupersededOperators, getTemplateStatusLine } from "./getTemplateStatusLine";
import { makeCompensationTemplate } from "./makeCompensationTemplate";
import type { CompensationTemplate } from "../../domain/entities";

const payRule: CompensationTemplate["rules"][number] = {
  routeType: "long_haul",
  commissionType: "rate_per_km",
  rateValue: 3,
  minimumGuaranteedAmount: 0,
};

function line(overrides: Partial<CompensationTemplate>) {
  return getTemplateStatusLine(
    makeCompensationTemplate({ id: "tpl-1", name: "Operador foráneo", ...overrides }),
  );
}

describe("getTemplateStatusLine (PRD D10)", () => {
  it("activa completa → sin línea", () => {
    expect(line({ status: "active", rules: [payRule] })).toBeNull();
  });

  it("borrador sin pago → «Falta definir el pago»", () => {
    expect(line({ status: "draft" })).toBe("Falta definir el pago");
  });

  it("borrador con ruta fija y sin reglas → «Lista para activar»", () => {
    expect(line({ status: "draft", corridorIds: ["cor-1"] })).toBe("Lista para activar");
  });

  it.each([
    [1, "Paga a 1 operador hasta que lo reasignes"],
    [3, "Paga a 3 operadores hasta que los reasignes"],
  ])("reemplazada con %i vigente(s) → «%s»", (count, expected) => {
    expect(
      line({ status: "inactive", inactiveReason: "superseded", activeAssignmentsCount: count }),
    ).toBe(expected);
  });

  it("CA5: reemplazada con 0 vigentes → «Sin operadores asignados», nunca «Paga a…»", () => {
    const result = line({
      status: "inactive",
      inactiveReason: "superseded",
      activeAssignmentsCount: 0,
    });
    expect(result).toBe("Sin operadores asignados");
    expect(result).not.toMatch(/Paga a|Sigue pagando/);
  });

  it.each([
    [1, "1 programado"],
    [2, "2 programados"],
  ])("reemplazada con 0 vigentes y %i programada(s) → «%s»", (scheduled, expected) => {
    expect(
      line({
        status: "inactive",
        inactiveReason: "superseded",
        activeAssignmentsCount: 0,
        scheduledAssignmentsCount: scheduled,
      }),
    ).toBe(expected);
  });

  it("programadas ausentes (API vieja) cuentan como 0", () => {
    expect(
      line({
        status: "inactive",
        inactiveReason: "superseded",
        activeAssignmentsCount: 0,
        scheduledAssignmentsCount: undefined,
      }),
    ).toBe("Sin operadores asignados");
  });

  it.each([
    ["manual", "manual" as const],
    ["null", null],
  ])("desactivada (%s) → «No calcula pagos»", (_label, inactiveReason) => {
    expect(line({ status: "inactive", inactiveReason, activeAssignmentsCount: 2 })).toBe(
      "No calcula pagos",
    );
  });

  it("inactiva sin motivo (API anterior) → sin línea", () => {
    expect(line({ status: "inactive" })).toBeNull();
  });
});

describe("getFamilySupersededOperators (PRD D18)", () => {
  const family = (current: number, scheduled: number): CompensationTemplate["family"] => ({
    versionsCount: 2,
    activeVersion: { id: "tpl-1", version: 2 },
    draftVersion: null,
    supersededActiveAssignmentsCount: current,
    supersededScheduledAssignmentsCount: scheduled,
  });

  function operators(overrides: Partial<CompensationTemplate>) {
    return getFamilySupersededOperators(
      makeCompensationTemplate({ id: "tpl-1", name: "Operador foráneo", ...overrides }),
    );
  }

  it("CA17: fila activa con 3 vigentes y 1 programada en reemplazadas → 4", () => {
    expect(operators({ status: "active", rules: [payRule], family: family(3, 1) })).toEqual({
      total: 4,
      current: 3,
      scheduled: 1,
    });
  });

  it("CA18: sin asignaciones en reemplazadas → null", () => {
    expect(operators({ status: "active", family: family(0, 0) })).toBeNull();
  });

  it.each([
    ["borrador", { status: "draft" as const }],
    ["reemplazada", { status: "inactive" as const, inactiveReason: "superseded" as const }],
    ["desactivada", { status: "inactive" as const, inactiveReason: "manual" as const }],
  ])("%s → null (manda D10)", (_label, overrides) => {
    expect(operators({ ...overrides, family: family(3, 1) })).toBeNull();
  });

  it("sin bloque `family` (listado sin agrupar) → null", () => {
    expect(operators({ status: "active" })).toBeNull();
  });
});
