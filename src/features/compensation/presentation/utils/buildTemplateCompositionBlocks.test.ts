import { describe, expect, it } from "vitest";
import { buildTemplateCompositionBlocks } from "./buildTemplateCompositionBlocks";
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

describe("buildTemplateCompositionBlocks", () => {
  it("returns three empty blocks when template has no configuration", () => {
    const blocks = buildTemplateCompositionBlocks(baseTemplate);

    expect(blocks).toHaveLength(3);
    expect(blocks.map((block) => block.id)).toEqual([
      "rules",
      "allowances",
      "corridors",
    ]);
    expect(blocks.every((block) => block.status === "empty")).toBe(true);
    expect(blocks.every((block) => block.items.length === 0)).toBe(true);
  });

  it("maps rules, allowances and corridors into structured items", () => {
    const blocks = buildTemplateCompositionBlocks({
      ...baseTemplate,
      rules: [
        {
          routeType: "long_haul",
          commissionType: "rate_per_km",
          rateValue: 4.5,
          minimumGuaranteedAmount: 1200,
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
      corridorIds: ["c-1"],
      corridors: [
        {
          id: "c-1",
          name: "CDMX → GDL",
          originRefType: "city",
          originRefValue: "CDMX",
          destinationRefType: "city",
          destinationRefValue: "GDL",
          fixedAmount: 3500,
          isActive: true,
        },
      ],
    });

    const rules = blocks.find((block) => block.id === "rules");
    const allowances = blocks.find((block) => block.id === "allowances");
    const corridors = blocks.find((block) => block.id === "corridors");

    expect(rules?.status).toBe("complete");
    expect(rules?.items[0]?.title).toBe("Foráneo");
    expect(rules?.items[0]?.subtitle).toContain("/km");
    expect(rules?.items[0]?.amount).toContain("Mín.");

    expect(allowances?.status).toBe("complete");
    expect(allowances?.items[0]?.title).toBe("Comidas");

    expect(corridors?.status).toBe("complete");
    expect(corridors?.items[0]?.title).toBe("CDMX → GDL");
    expect(corridors?.items[0]?.subtitle).toBe("CDMX → GDL");
  });

  it("falls back to corridor ids when corridor entities are missing", () => {
    const blocks = buildTemplateCompositionBlocks({
      ...baseTemplate,
      corridorIds: ["corridor-uuid-123"],
    });

    const corridors = blocks.find((block) => block.id === "corridors");

    expect(corridors?.status).toBe("complete");
    expect(corridors?.items[0]?.subtitle).toBe("corridor-uuid-123");
  });
});
