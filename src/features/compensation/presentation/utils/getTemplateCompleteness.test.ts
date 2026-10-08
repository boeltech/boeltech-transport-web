import { describe, expect, it } from "vitest";
import {
  getTemplateCompleteness,
  getTemplateSectionStatuses,
  getTemplateUsageStatus,
} from "./getTemplateCompleteness";
import type { CompensationTemplate } from "../../domain/entities";

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

describe("getTemplateCompleteness", () => {
  it("marks template incomplete when it has no rules or corridors", () => {
    const result = getTemplateCompleteness(baseTemplate);
    expect(result.isComplete).toBe(false);
    expect(result.missingSteps).toEqual(["rules", "corridors"]);
    expect(result.sectionStatuses.payment).toBe("empty");
    expect(result.sectionStatuses.corridors).toBe("empty");
    expect(result.sectionStatuses.allowances).toBe("empty");
    expect(result.sectionStatuses).not.toHaveProperty("review");
    expect(result.sectionStatuses).not.toHaveProperty("identity");
  });

  it("is complete with only route rules", () => {
    const result = getTemplateCompleteness({
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
    expect(result.isComplete).toBe(true);
    expect(result.missingSteps).toEqual([]);
    expect(result.sectionStatuses.payment).toBe("complete");
  });

  it("is complete with only linked corridors", () => {
    const result = getTemplateCompleteness({
      ...baseTemplate,
      corridorIds: ["c-1"],
    });
    expect(result.isComplete).toBe(true);
    expect(result.missingSteps).toEqual([]);
    expect(result.sectionStatuses.corridors).toBe("complete");
  });
});

describe("getTemplateUsageStatus", () => {
  it("returns needs_payment when active but incomplete", () => {
    expect(getTemplateUsageStatus(baseTemplate)).toBe("needs_payment");
  });

  it("returns ready when active and complete", () => {
    expect(
      getTemplateUsageStatus({
        ...baseTemplate,
        corridorIds: ["c-1"],
      }),
    ).toBe("ready");
  });

  it("returns ready_to_activate when draft and complete", () => {
    expect(
      getTemplateUsageStatus({
        ...baseTemplate,
        status: "draft",
        isActive: false,
        corridorIds: ["c-1"],
      }),
    ).toBe("ready_to_activate");
  });

  it("returns paused when inactive even if complete", () => {
    expect(
      getTemplateUsageStatus({
        ...baseTemplate,
        status: "inactive",
        isActive: false,
        rules: [
          {
            routeType: "local",
            commissionType: "none",
            rateValue: 0,
            minimumGuaranteedAmount: 0,
          },
        ],
      }),
    ).toBe("paused");
  });

  it("returns superseded_paying when inactive because it was replaced", () => {
    expect(
      getTemplateUsageStatus({
        ...baseTemplate,
        status: "inactive",
        isActive: false,
        inactiveReason: "superseded",
        corridorIds: ["c-1"],
      }),
    ).toBe("superseded_paying");
  });

  it.each([
    ["manual", "manual" as const],
    ["null", null],
  ])("returns paused when inactive with reason %s", (_label, inactiveReason) => {
    expect(
      getTemplateUsageStatus({
        ...baseTemplate,
        status: "inactive",
        isActive: false,
        inactiveReason,
        corridorIds: ["c-1"],
      }),
    ).toBe("paused");
  });
});

describe("getTemplateSectionStatuses", () => {
  it("marks allowances complete only when present", () => {
    expect(getTemplateSectionStatuses(baseTemplate).allowances).toBe("empty");
    expect(
      getTemplateSectionStatuses({
        ...baseTemplate,
        fixedAllowances: [
          {
            allowanceType: "meals",
            label: "Comidas",
            amount: 500,
            period: "weekly",
            isMandatory: true,
          },
        ],
      }).allowances,
    ).toBe("complete");
  });

  it("does not track identity as a builder section", () => {
    expect(getTemplateSectionStatuses(baseTemplate)).not.toHaveProperty("identity");
  });
});
