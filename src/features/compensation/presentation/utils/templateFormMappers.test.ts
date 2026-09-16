import { describe, expect, it } from "vitest";
import {
  DEFAULT_TEMPLATE_FORM_VALUES,
  buildDuplicateTemplatePayload,
  templateToForm,
} from "./templateFormMappers";
import type { CompensationTemplate } from "../../domain/entities";

const sampleTemplate: CompensationTemplate = {
  id: "tpl-1",
  name: "Esquema foráneo",
  description: "Notas",
  isActive: false,
  midTripPayoutPolicy: "split_by_assigned_km",
  rules: [
    {
      routeType: "long_haul",
      commissionType: "rate_per_km",
      rateValue: 3,
      minimumGuaranteedAmount: 100,
      notes: "test",
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
  corridorIds: ["cccccccc-cccc-4ccc-8ccc-cccccccccccc"],
  corridors: [],
  activeAssignmentsCount: 0,
};

describe("templateToForm", () => {
  it("maps template entity to form defaults", () => {
    expect(templateToForm(sampleTemplate)).toEqual({
      name: "Esquema foráneo",
      description: "Notas",
      isActive: false,
      midTripPayoutPolicy: "split_by_assigned_km",
      rules: [
        {
          routeType: "long_haul",
          commissionType: "rate_per_km",
          rateValue: 3,
          minimumGuaranteedAmount: 100,
          notes: "test",
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
      corridorIds: ["cccccccc-cccc-4ccc-8ccc-cccccccccccc"],
    });
  });

  it("uses empty defaults when description is null", () => {
    expect(
      templateToForm({
        ...sampleTemplate,
        description: null,
      }).description,
    ).toBe("");
  });

  it("exposes shared default form values for create flows", () => {
    expect(DEFAULT_TEMPLATE_FORM_VALUES.rules).toHaveLength(1);
    expect(DEFAULT_TEMPLATE_FORM_VALUES.isActive).toBe(true);
  });

  it("builds duplicate payload with suffix and cloned configuration", () => {
    expect(buildDuplicateTemplatePayload(sampleTemplate, "(copia)")).toEqual({
      name: "Esquema foráneo (copia)",
      description: "Notas",
      isActive: false,
      midTripPayoutPolicy: "split_by_assigned_km",
      rules: [
        {
          routeType: "long_haul",
          commissionType: "rate_per_km",
          rateValue: 3,
          minimumGuaranteedAmount: 100,
          notes: "test",
        },
      ],
      fixedAllowances: sampleTemplate.fixedAllowances,
      corridorIds: sampleTemplate.corridorIds,
    });
  });
});
