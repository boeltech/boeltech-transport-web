import { describe, expect, it } from "vitest";
import type { CompensationTemplate } from "../../domain/entities";
import {
  COMPENSATION_CORRIDORS_PATH,
  COMPENSATION_TEMPLATES_PATH,
  compensationTemplateBuildPath,
  compensationTemplateOperatorsPath,
} from "../compensationRoutes";
import { buildCompensationReadinessItems } from "./useCompensationReadiness";

function makeTemplate(
  overrides: Partial<CompensationTemplate> & Pick<CompensationTemplate, "id">,
): CompensationTemplate {
  return {
    name: "Esquema",
    description: null,
    isActive: true,
    rules: [],
    fixedAllowances: [],
    corridorIds: [],
    corridors: [],
    activeAssignmentsCount: 0,
    ...overrides,
  };
}

describe("buildCompensationReadinessItems", () => {
  it("marks empty templates and assignments when totals are zero", () => {
    const { items, isReady } = buildCompensationReadinessItems({
      templates: [],
      templatesTotal: 0,
      corridorsTotal: 0,
      assignmentsTotal: 0,
    });

    expect(isReady).toBe(false);
    expect(items).toHaveLength(4);

    const byId = Object.fromEntries(items.map((item) => [item.id, item]));
    expect(byId.templates_active).toMatchObject({
      value: 0,
      status: "empty",
      href: COMPENSATION_TEMPLATES_PATH,
    });
    expect(byId.templates_incomplete).toMatchObject({
      value: 0,
      status: "ok",
      href: COMPENSATION_TEMPLATES_PATH,
    });
    expect(byId.corridors_active).toMatchObject({
      value: 0,
      status: "info",
      href: COMPENSATION_CORRIDORS_PATH,
    });
    expect(byId.assignments_active).toMatchObject({
      value: 0,
      status: "empty",
      href: COMPENSATION_TEMPLATES_PATH,
    });
  });

  it("is ready when there is at least one active template and one assignment", () => {
    const template = makeTemplate({
      id: "tpl-1",
      rules: [
        {
          routeType: "long_haul",
          commissionType: "rate_per_km",
          rateValue: 3,
          minimumGuaranteedAmount: 0,
        },
      ],
    });

    const { items, isReady } = buildCompensationReadinessItems({
      templates: [template],
      templatesTotal: 1,
      corridorsTotal: 2,
      assignmentsTotal: 5,
    });

    expect(isReady).toBe(true);
    expect(items.find((i) => i.id === "templates_active")).toMatchObject({
      value: 1,
      status: "ok",
    });
    expect(items.find((i) => i.id === "assignments_active")).toMatchObject({
      value: 5,
      status: "ok",
      href: compensationTemplateOperatorsPath("tpl-1"),
    });
    expect(items.find((i) => i.id === "corridors_active")).toMatchObject({
      value: 2,
      status: "info",
    });
    expect(items.find((i) => i.id === "templates_incomplete")).toMatchObject({
      value: 0,
      status: "ok",
    });
  });

  it("warns on incomplete templates and links to Builder", () => {
    const incomplete = makeTemplate({ id: "tpl-incomplete", name: "Borrador" });
    const complete = makeTemplate({
      id: "tpl-ok",
      corridorIds: ["c-1"],
    });

    const { items, isReady } = buildCompensationReadinessItems({
      templates: [incomplete, complete],
      templatesTotal: 2,
      corridorsTotal: 1,
      assignmentsTotal: 0,
    });

    expect(isReady).toBe(false);
    expect(items.find((i) => i.id === "templates_incomplete")).toMatchObject({
      value: 1,
      status: "warn",
      href: compensationTemplateBuildPath("tpl-incomplete"),
    });
  });

  it("uses templatesTotal for active count even if page is truncated", () => {
    const { items } = buildCompensationReadinessItems({
      templates: [makeTemplate({ id: "tpl-1", corridorIds: ["c-1"] })],
      templatesTotal: 12,
      corridorsTotal: 0,
      assignmentsTotal: 3,
    });

    expect(items.find((i) => i.id === "templates_active")?.value).toBe(12);
    expect(items.find((i) => i.id === "templates_active")?.status).toBe("ok");
  });
});
