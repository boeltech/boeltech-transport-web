import { describe, expect, it } from "vitest";
import {
  buildTemplateStructuredSummary,
  buildTemplateSummary,
} from "./buildTemplateSummary";
import type { CompensationTemplate } from "../../domain/entities";

const baseTemplate: CompensationTemplate = {
  id: "tpl-1",
  name: "Test",
  isActive: true,
  rules: [],
  fixedAllowances: [],
  corridorIds: [],
  corridors: [],
  activeAssignmentsCount: 0,
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
      corridorIds: ["c-1", "c-2"],
      corridors: [
        {
          id: "c-1",
          name: "México → MTY",
          originRefType: "city_label",
          originRefValue: "CDMX",
          destinationRefType: "city_label",
          destinationRefValue: "MTY",
          fixedAmount: 1500,
          isActive: true,
        },
      ],
    };

    const summary = buildTemplateSummary(template);
    expect(summary).toMatch(/Cuando viaje foráneo, pagar/i);
    expect(summary).toMatch(/mínimo garantizado/i);
    expect(summary).toMatch(/Pago fijo Comidas/i);
    expect(summary).toMatch(/2 rutas con precio fijo/i);
  });
});

describe("buildTemplateStructuredSummary", () => {
  it("returns empty array when nothing configured", () => {
    expect(buildTemplateStructuredSummary(baseTemplate)).toEqual([]);
  });

  it("builds prose lines for inspector", () => {
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
      corridors: [
        {
          id: "c-1",
          name: "México → MTY",
          originRefType: "city_label",
          originRefValue: "CDMX",
          destinationRefType: "city_label",
          destinationRefValue: "MTY",
          fixedAmount: 1500,
          isActive: true,
        },
      ],
    });

    expect(lines[0]?.text).toMatch(/Cuando viaje local/i);
    expect(lines.some((line) => line.text.includes("México → MTY"))).toBe(true);
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
    expect(lines[1]?.text).toMatch(/Pago fijo Comidas/i);
  });
});
