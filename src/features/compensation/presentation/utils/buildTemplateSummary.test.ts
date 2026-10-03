import { describe, expect, it } from "vitest";
import {
  buildTemplateStructuredSummary,
  buildTemplateSummary,
} from "./buildTemplateSummary";
import type { CompensationTemplate } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";

const baseTemplate: CompensationTemplate = {
  id: "tpl-1",
  name: "Test",
  isActive: true,
  rules: [],
  fixedAllowances: [],
  deductions: [],
  corridorIds: [],
  corridors: [],
  activeAssignmentsCount: 0,
};

const mtyCorridor: CompensationTemplate["corridors"][number] = {
  id: "c-1",
  name: "México → MTY",
  originRefType: "city_label",
  originRefValue: "CDMX",
  destinationRefType: "city_label",
  destinationRefValue: "MTY",
  fixedAmount: 1500,
  isActive: true,
};

describe("buildTemplateSummary", () => {
  it("returns empty label when nothing configured", () => {
    expect(buildTemplateSummary(baseTemplate)).toBe("Sin configurar");
  });

  it("summarizes rules, allowances and corridors in business prose", () => {
    const template: CompensationTemplate = {
      ...baseTemplate,
      rules: [
        {
          routeType: "long_haul",
          commissionType: "rate_per_km",
          rateValue: 3,
          minimumGuaranteedAmount: 400,
        },
      ],
      fixedAllowances: [
        {
          allowanceType: "meals",
          label: "Comidas",
          amount: 500,
          period: "weekly",
          isMandatory: true,
        },
      ],
      deductions: [
        {
          deductionType: "savings_fund",
          label: "Fondo de ahorro",
          amount: 200,
          period: "weekly",
          isMandatory: true,
        },
      ],
      corridorIds: ["c-1", "c-2"],
      corridors: [mtyCorridor],
    };

    const summary = buildTemplateSummary(template);
    expect(summary).toMatch(/Cuando viaje foráneo, pagar/i);
    expect(summary).toMatch(/mínimo garantizado/i);
    expect(summary).toMatch(/Pago fijo de tarifa Comidas/i);
    expect(summary).toMatch(/1× por pago/i);
    expect(summary).toMatch(/ritmo/i);
    expect(summary).not.toMatch(/prorrate/i);
    expect(summary).toMatch(/Deducción Fondo de ahorro/i);
    expect(summary).toMatch(/2 rutas con tarifa fija/i);
    // Precedence hint is inspector-only; compact summary omits it.
    expect(summary).not.toMatch(/Si el viaje coincide/i);
  });
});

describe("buildTemplateStructuredSummary", () => {
  it("returns empty array when nothing configured", () => {
    expect(buildTemplateStructuredSummary(baseTemplate)).toEqual([]);
  });

  it("when rules and corridors coexist, shows precedence then corridors then rules", () => {
    const lines = buildTemplateStructuredSummary({
      ...baseTemplate,
      rules: [
        {
          routeType: "long_haul",
          commissionType: "rate_per_km",
          rateValue: 3,
          minimumGuaranteedAmount: 0,
        },
      ],
      corridorIds: ["c-1"],
      corridors: [mtyCorridor],
    });

    expect(lines[0]).toEqual({
      id: "precedence",
      text: compensationCopy.builder.inspectorPrecedenceHint,
      variant: "hint",
    });
    expect(lines[1]?.id).toBe("corridors");
    expect(lines[1]?.text).toMatch(/México → MTY/);
    expect(lines[2]?.id).toBe("rule-long_haul");
    expect(lines[2]?.text).toMatch(/Cuando viaje foráneo/i);
    expect(lines.some((line) => line.id.startsWith("rule-") && /tarifa fija/i.test(line.text))).toBe(
      false,
    );
  });

  it("does not emit precedence when only rules are present", () => {
    const lines = buildTemplateStructuredSummary({
      ...baseTemplate,
      rules: [
        {
          routeType: "local",
          commissionType: "none",
          rateValue: 0,
          minimumGuaranteedAmount: 0,
        },
      ],
    });

    expect(lines).toHaveLength(1);
    expect(lines[0]?.id).toBe("rule-local");
    expect(lines.some((line) => line.id === "precedence")).toBe(false);
  });

  it("does not emit precedence when only corridors are present", () => {
    const lines = buildTemplateStructuredSummary({
      ...baseTemplate,
      corridorIds: ["c-1"],
      corridors: [mtyCorridor],
    });

    expect(lines).toHaveLength(1);
    expect(lines[0]?.id).toBe("corridors");
    expect(lines.some((line) => line.id === "precedence")).toBe(false);
  });

  it("keeps extras and deductions after payment layers when mixed", () => {
    const lines = buildTemplateStructuredSummary({
      ...baseTemplate,
      rules: [
        {
          routeType: "local",
          commissionType: "none",
          rateValue: 0,
          minimumGuaranteedAmount: 0,
        },
      ],
      corridorIds: ["c-1"],
      corridors: [mtyCorridor],
      fixedAllowances: [
        {
          allowanceType: "meals",
          label: "Comidas",
          amount: 500,
          period: "weekly",
          isMandatory: true,
        },
      ],
      deductions: [
        {
          deductionType: "savings_fund",
          label: "Fondo de ahorro",
          amount: 200,
          period: "weekly",
          isMandatory: true,
        },
      ],
    });

    expect(lines.map((line) => line.id)).toEqual([
      "precedence",
      "corridors",
      "rule-local",
      "allowance-Comidas-0",
      "deduction-Fondo de ahorro-0",
    ]);
  });

  it("tolerates incomplete rules from a partial form watch", () => {
    const lines = buildTemplateStructuredSummary({
      ...baseTemplate,
      rules: [
        {
          routeType: undefined as unknown as CompensationTemplate["rules"][number]["routeType"],
          commissionType: "rate_per_km",
          rateValue: 3,
          minimumGuaranteedAmount: 0,
        },
        {
          routeType: "long_haul",
          commissionType: "rate_per_km",
          rateValue: 3,
          minimumGuaranteedAmount: 0,
        },
      ],
      fixedAllowances: [
        {
          allowanceType: "meals",
          label: "Comidas",
          amount: 500,
          period: undefined as unknown as CompensationTemplate["fixedAllowances"][number]["period"],
          isMandatory: true,
        },
      ],
    });

    expect(lines).toHaveLength(2);
    expect(lines[0]?.text).toMatch(/Cuando viaje foráneo/i);
    expect(lines[1]?.text).toMatch(/Pago fijo de tarifa Comidas/i);
    expect(lines[1]?.text).toMatch(/1× por pago/i);
  });
});
