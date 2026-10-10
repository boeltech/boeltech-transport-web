import { describe, expect, it } from "vitest";
import { buildTemplateListSummary } from "./buildTemplateListSummary";
import { compensationCopy } from "../copy/compensationCopy";
import type { CompensationTemplate } from "../../domain/entities";

type Corridor = CompensationTemplate["corridors"][number];
type Rule = CompensationTemplate["rules"][number];

const empty = {
  rules: [] as Rule[],
  fixedAllowances: [] as CompensationTemplate["fixedAllowances"],
  deductions: [] as CompensationTemplate["deductions"],
  corridors: [] as Corridor[],
};

function corridor(overrides: Partial<Corridor> & Pick<Corridor, "id">): Corridor {
  return {
    name: "México → MTY",
    originRefType: "city_label",
    originRefValue: "Ciudad de México",
    destinationRefType: "city_label",
    destinationRefValue: "Monterrey",
    fixedAmount: 1500,
    isActive: true,
    ...overrides,
  };
}

function rule(overrides: Partial<Rule>): Rule {
  return {
    routeType: "long_haul",
    commissionType: "rate_per_km",
    rateValue: 3,
    minimumGuaranteedAmount: 0,
    ...overrides,
  };
}

const comidas = {
  allowanceType: "meals" as const,
  label: "Comidas",
  amount: 500,
  period: "weekly" as const,
  isMandatory: true,
};

const ahorro = {
  deductionType: "savings_fund" as const,
  label: "Fondo de ahorro",
  amount: 200,
  period: "weekly" as const,
  isMandatory: true,
};

describe("buildTemplateListSummary (PRD D7–D9)", () => {
  it("D9: sin pago → vacío y sin tooltip", () => {
    expect(buildTemplateListSummary(empty)).toEqual({
      isEmpty: true,
      primary: [],
      secondary: [],
      tooltip: [],
    });
  });

  it("D7 línea 1: un segmento por clase con su forma de pago", () => {
    const summary = buildTemplateListSummary({
      ...empty,
      rules: [
        rule({ routeType: "long_haul", commissionType: "rate_per_km", rateValue: 3 }),
        rule({ routeType: "local", commissionType: "fixed_per_trip", rateValue: 500 }),
        rule({ routeType: "long_haul", commissionType: "percentage_of_freight", rateValue: 12 }),
        rule({ routeType: "transfer", commissionType: "none", rateValue: 0 }),
      ],
    });

    expect(summary.isEmpty).toBe(false);
    expect(summary.primary).toEqual([
      "Foráneo $3.00/km",
      "Local $500.00/viaje",
      "Foráneo 12% del flete",
      "Transfer / Patio sin pago por viaje",
    ]);
    expect(summary.secondary).toEqual([]);
  });

  it("D7 línea 2: una ruta activa, pagos fijos y deducciones como conteos", () => {
    const summary = buildTemplateListSummary({
      ...empty,
      rules: [rule({})],
      corridors: [corridor({ id: "cor-1" })],
      fixedAllowances: [comidas],
      deductions: [ahorro, { ...ahorro, label: "Cuota" }],
    });

    expect(summary.primary).toEqual(["Foráneo $3.00/km"]);
    expect(summary.secondary).toEqual(["1 ruta fija $1,500.00", "+1 pago fijo", "−2 deducciones"]);
    expect(summary.secondary.join(" ")).not.toMatch(/México → MTY/);
  });

  it("D7: rango min–max y «c/u» solo con rutas activas", () => {
    const range = buildTemplateListSummary({
      ...empty,
      rules: [rule({})],
      corridors: [
        corridor({ id: "a", fixedAmount: 1500 }),
        corridor({ id: "b", fixedAmount: 2200 }),
        corridor({ id: "c", fixedAmount: 9900, isActive: false }),
      ],
    });
    expect(range.secondary).toEqual(["2 rutas fijas $1,500.00–$2,200.00"]);

    const same = buildTemplateListSummary({
      ...empty,
      rules: [rule({})],
      corridors: [corridor({ id: "a" }), corridor({ id: "b" })],
      fixedAllowances: [comidas, comidas],
    });
    expect(same.secondary).toEqual(["2 rutas fijas $1,500.00 c/u", "+2 pagos fijos"]);
  });

  it("D7: solo rutas fijas → pasan a la línea 1", () => {
    const summary = buildTemplateListSummary({
      ...empty,
      corridors: [corridor({ id: "a" })],
      fixedAllowances: [comidas],
    });

    expect(summary.primary).toEqual(["1 ruta fija $1,500.00"]);
    expect(summary.secondary).toEqual(["+1 pago fijo"]);
  });

  it("solo rutas inactivas → «Sin configurar» y el tooltip las marca", () => {
    const summary = buildTemplateListSummary({
      ...empty,
      corridors: [corridor({ id: "a", isActive: false })],
    });

    expect(summary.isEmpty).toBe(true);
    expect(summary.tooltip).toEqual([
      "México → MTY: Ciudad de México → Monterrey · $1,500.00 (inactiva)",
    ]);
  });

  it("D8: tooltip con precedencia, rutas con sucursal, mínimo, pagos fijos y deducciones", () => {
    const branchNameMap = new Map([["branch-1", "MTY — Monterrey Norte"]]);
    const summary = buildTemplateListSummary(
      {
        ...empty,
        rules: [rule({ minimumGuaranteedAmount: 400 }), rule({ routeType: "local", commissionType: "none" })],
        corridors: [
          corridor({
            id: "a",
            name: "Patio norte",
            destinationRefType: "branch",
            destinationRefValue: "branch-1",
          }),
        ],
        fixedAllowances: [comidas],
        deductions: [ahorro],
      },
      branchNameMap,
    );

    expect(summary.tooltip).toEqual([
      compensationCopy.builder.inspectorPrecedenceHint,
      "Patio norte: Ciudad de México → MTY — Monterrey Norte · $1,500.00",
      "Foráneo $3.00/km · Mínimo garantizado $400.00",
      "Local sin pago por viaje",
      "Comidas: $500.00 · semanal",
      "Fondo de ahorro: −$200.00 · semanal",
    ]);
  });

  it("tooltip: cada pago fijo y deducción con su periodo", () => {
    const summary = buildTemplateListSummary({
      ...empty,
      rules: [rule({})],
      fixedAllowances: [{ ...comidas, period: "biweekly" }],
      deductions: [{ ...ahorro, period: "monthly" }],
    });

    expect(summary.tooltip).toEqual([
      "Foráneo $3.00/km",
      "Comidas: $500.00 · quincenal",
      "Fondo de ahorro: −$200.00 · mensual",
    ]);
  });

  it("sin rutas activas no repite la regla de precedencia", () => {
    const summary = buildTemplateListSummary({
      ...empty,
      rules: [rule({})],
      corridors: [corridor({ id: "a", isActive: false })],
    });

    expect(summary.tooltip[0]).not.toBe(compensationCopy.builder.inspectorPrecedenceHint);
  });
});
