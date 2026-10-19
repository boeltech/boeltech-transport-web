import { describe, expect, it } from "vitest";
import { COMMISSION_GOLDEN_CASES } from "./commissionGoldenCases";
import {
  computeRuleCommission,
  simulateCompensation,
  describeRuleProse,
  describeAllowanceProse,
  describeDeductionProse,
  SIMULATION_DEFAULTS,
  type SimulationInput,
} from "./simulateCompensation";
import type {
  CompensationTemplateRule,
  TemplateDeduction,
  TemplateFixedAllowance,
} from "../../domain/entities";

const ratePerKmRule: CompensationTemplateRule = {
  routeType: "long_haul",
  commissionType: "rate_per_km",
  rateValue: 3,
  minimumGuaranteedAmount: 400,
};

const percentageRule: CompensationTemplateRule = {
  routeType: "long_haul",
  commissionType: "percentage_of_freight",
  rateValue: 8,
  minimumGuaranteedAmount: 0,
};

const fixedPerTripRule: CompensationTemplateRule = {
  routeType: "local",
  commissionType: "fixed_per_trip",
  rateValue: 500,
  minimumGuaranteedAmount: 0,
};

const noneRuleWithStaleMinimum: CompensationTemplateRule = {
  routeType: "local",
  commissionType: "none",
  rateValue: 5,
  minimumGuaranteedAmount: 500,
};

const mealsAllowance: TemplateFixedAllowance = {
  allowanceType: "meals",
  label: "Comidas",
  amount: 500,
  period: "weekly",
  isMandatory: true,
};

const transportAllowance: TemplateFixedAllowance = {
  allowanceType: "transport",
  label: "Transporte",
  amount: 300,
  period: "biweekly",
  isMandatory: true,
};

describe("simulateCompensation", () => {
  const defaultInput: SimulationInput = { ...SIMULATION_DEFAULTS };

  it("calculates rate_per_km correctly", () => {
    const result = simulateCompensation([ratePerKmRule], [], defaultInput);

    expect(result.total).toBe(920 * 3);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.source).toBe("rule");
    expect(result.matchedRule).toBe(ratePerKmRule);
  });

  it("applies minimum guaranteed amount", () => {
    const input: SimulationInput = {
      routeType: "long_haul",
      distanceKm: 50,
      freightRevenue: 5000,
    };
    const result = simulateCompensation([ratePerKmRule], [], input);

    expect(result.total).toBe(400);
  });

  it("calculates percentage_of_freight correctly", () => {
    const result = simulateCompensation([percentageRule], [], defaultInput);

    expect(result.total).toBe(18_000 * 0.08);
    expect(result.items[0]?.amount).toBe(1440);
    expect(result.items[0]?.label).toBe("8% del flete (foráneo)");
  });

  it("calculates fixed_per_trip correctly", () => {
    const input: SimulationInput = {
      routeType: "local",
      distanceKm: 50,
      freightRevenue: 5000,
    };
    const result = simulateCompensation([fixedPerTripRule], [], input);

    expect(result.total).toBe(500);
  });

  it("adds fixed allowances to total", () => {
    const result = simulateCompensation(
      [ratePerKmRule],
      [mealsAllowance, transportAllowance],
      defaultInput,
    );

    expect(result.total).toBe(920 * 3 + 500 + 300);
    expect(result.items).toHaveLength(3);
    expect(result.items[1]?.source).toBe("allowance");
    expect(result.items[2]?.source).toBe("allowance");
  });

  it("uses corridor fixed amount when provided (overrides rule)", () => {
    const result = simulateCompensation(
      [ratePerKmRule],
      [mealsAllowance],
      defaultInput,
      4500,
      "CDMX → Monterrey",
    );

    expect(result.items[0]?.source).toBe("corridor");
    expect(result.items[0]?.amount).toBe(4500);
    expect(result.total).toBe(4500 + 500);
    expect(result.matchedRule).toBeNull();
    expect(result.corridorMatchName).toBe("CDMX → Monterrey");
  });

  it("returns empty when no rule matches and no allowances", () => {
    const input: SimulationInput = {
      routeType: "transfer",
      distanceKm: 50,
      freightRevenue: 5000,
    };
    const result = simulateCompensation([ratePerKmRule], [], input);

    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
    expect(result.matchedRule).toBeNull();
  });

  it("none pays 0 even with a stored minimum guaranteed amount", () => {
    const input: SimulationInput = {
      routeType: "local",
      distanceKm: 50,
      freightRevenue: 5000,
    };
    const result = simulateCompensation([noneRuleWithStaleMinimum], [], input);

    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
    expect(result.minimumApplied).toBe(false);
  });

  it("applies the minimum when the calculation is 0 km and labels it", () => {
    const input: SimulationInput = {
      routeType: "long_haul",
      distanceKm: 0,
      freightRevenue: 5000,
    };
    const result = simulateCompensation([ratePerKmRule], [], input);

    expect(result.total).toBe(400);
    expect(result.minimumApplied).toBe(true);
    expect(result.items[0]?.label).toBe("Pago por km (foráneo) · mínimo garantizado");
  });

  it("does not label the rule when the calculation exceeds the minimum", () => {
    const result = simulateCompensation([ratePerKmRule], [], defaultInput);

    expect(result.minimumApplied).toBe(false);
    expect(result.items[0]?.label).toBe("Pago por km (foráneo)");
  });

  it("skips allowances with zero or negative amount", () => {
    const zeroAllowance: TemplateFixedAllowance = {
      allowanceType: "other",
      label: "Test",
      amount: 0,
      period: "weekly",
      isMandatory: false,
    };
    const result = simulateCompensation([], [zeroAllowance], defaultInput);

    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it("subtracts deductions from net total", () => {
    const savings: TemplateDeduction = {
      deductionType: "savings_fund",
      label: "Fondo de ahorro",
      amount: 200,
      period: "weekly",
      isMandatory: true,
    };
    const result = simulateCompensation(
      [ratePerKmRule],
      [mealsAllowance],
      defaultInput,
      undefined,
      undefined,
      [savings],
    );

    expect(result.gross).toBe(920 * 3 + 500);
    expect(result.totalDeductions).toBe(200);
    expect(result.total).toBe(920 * 3 + 500 - 200);
    expect(result.items.some((item) => item.source === "deduction")).toBe(true);
    expect(result.items.find((item) => item.source === "deduction")?.formattedAmount).toMatch(
      /^-/,
    );
  });
});

describe("casos dorados (paridad con el API)", () => {
  it("cubre los 14 casos de la contraparte API", () => {
    expect(COMMISSION_GOLDEN_CASES).toHaveLength(14);
  });

  it.each(COMMISSION_GOLDEN_CASES.map((goldenCase) => [goldenCase.id, goldenCase] as const))(
    "%s",
    (_id, goldenCase) => {
      const rules: CompensationTemplateRule[] = goldenCase.rule
        ? [{ routeType: goldenCase.trip.routeType, ...goldenCase.rule }]
        : [];

      const result = simulateCompensation(rules, [], goldenCase.trip);

      expect(result.total).toBe(goldenCase.expected.amount);
      expect(result.minimumApplied).toBe(goldenCase.expected.minimumApplied);

      const [rule] = rules;
      if (rule) {
        expect(computeRuleCommission(rule, goldenCase.trip)).toEqual({
          amount: goldenCase.expected.amount,
          minimumApplied: goldenCase.expected.minimumApplied,
          calculationGap: goldenCase.expected.calculationGap,
        });
      }
    },
  );
});

describe("describeRuleProse", () => {
  it("describes rate_per_km with minimum", () => {
    const prose = describeRuleProse("long_haul", "rate_per_km", 3, 400);

    expect(prose).toContain("$3.00");
    expect(prose).toContain("km recorrido");
    expect(prose).toContain("foráneo");
    expect(prose).toContain("mínimo garantizado");
    expect(prose).toContain("$400");
  });

  it("describes percentage_of_freight", () => {
    const prose = describeRuleProse("long_haul", "percentage_of_freight", 8, 0);

    expect(prose).toContain("8%");
    expect(prose).toContain("del flete");
  });

  it("describes fixed_per_trip", () => {
    const prose = describeRuleProse("local", "fixed_per_trip", 500, 0);

    expect(prose).toContain("$500");
    expect(prose).toContain("cada viaje");
    expect(prose).toContain("local");
  });

  it("describes none", () => {
    const prose = describeRuleProse("local", "none", 0, 0);

    expect(prose).toContain("clase de ruta");
    expect(prose).toContain("no tiene pago por viaje");
  });

  it("labels Transfer / Patio (no Movimiento local)", () => {
    const prose = describeRuleProse("transfer", "fixed_per_trip", 200, 0);

    expect(prose).toMatch(/transfer \/ patio/i);
    expect(prose).not.toMatch(/Movimiento local/i);
  });

  it("returns null for undefined routeType", () => {
    expect(describeRuleProse(undefined, "rate_per_km", 3, 0)).toBeNull();
  });
});

describe("describeAllowanceProse", () => {
  it("describes allowance with period", () => {
    const prose = describeAllowanceProse("Comidas", 500, "weekly");

    expect(prose).toContain("Comidas");
    expect(prose).toContain("$500");
    expect(prose).toContain("semanal");
    expect(prose).toContain("1× al bruto");
  });

  it("handles zero amount", () => {
    const prose = describeAllowanceProse("Test", 0, "monthly");

    expect(prose).toContain("sin monto configurado");
  });

  it("handles missing period", () => {
    const prose = describeAllowanceProse("Transporte", 300, undefined);

    expect(prose).toContain("$300");
    expect(prose).not.toContain("ritmo");
  });
});

describe("describeDeductionProse", () => {
  it("describes deduction with period", () => {
    const prose = describeDeductionProse("Fondo de ahorro", 200, "weekly");

    expect(prose).toContain("Fondo de ahorro");
    expect(prose).toContain("$200");
    expect(prose).toContain("semanal");
    expect(prose).toContain("resta del neto");
  });

  it("handles zero amount", () => {
    const prose = describeDeductionProse("Retención", 0, "monthly");

    expect(prose).toContain("sin monto configurado");
  });
});
