import { describe, expect, it } from "vitest";
import {
  parseTemplateListStatusFilter,
  TEMPLATE_LIST_STATUS_OPTIONS,
  templateListStatusFilterLabel,
  templateListStatusFilterToQuery,
  templateListStatusFilterToUrl,
} from "./templateListStatusFilter";

describe("templateListStatusFilter (PRD D22)", () => {
  it.each([
    [null, "current"],
    ["", "current"],
    ["desconocido", "current"],
    ["current", "current"],
    ["active", "active"],
    ["draft", "draft"],
    ["superseded", "superseded"],
    ["deactivated", "deactivated"],
    ["all", "all"],
    ["inactive", "inactive"],
  ] as const)("?status=%s → %s", (raw, expected) => {
    expect(parseTemplateListStatusFilter(raw)).toBe(expected);
  });

  it("«Vigentes» no va en la URL; «Todos los estados» sí, como `all`", () => {
    expect(templateListStatusFilterToUrl("current")).toBe("");
    expect(templateListStatusFilterToUrl("all")).toBe("all");
    expect(templateListStatusFilterToUrl("superseded")).toBe("superseded");
    expect(parseTemplateListStatusFilter(templateListStatusFilterToUrl("all"))).toBe("all");
  });

  it.each([
    ["current", { groupBy: "family", scope: "current" }],
    ["active", { groupBy: "family", status: "active" }],
    ["draft", { groupBy: "family", status: "draft" }],
    ["superseded", { groupBy: "family", status: "inactive", inactiveReason: "superseded" }],
    ["deactivated", { groupBy: "family", status: "inactive", inactiveReason: "manual" }],
    ["inactive", { groupBy: "family", status: "inactive" }],
    ["all", { groupBy: "family" }],
  ] as const)("%s → parámetros del API", (filter, expected) => {
    expect(templateListStatusFilterToQuery(filter)).toEqual(expected);
  });

  it("opciones visibles en orden, sin la de enlaces viejos", () => {
    expect(TEMPLATE_LIST_STATUS_OPTIONS.map(templateListStatusFilterLabel)).toEqual([
      "Vigentes",
      "Activas",
      "Borradores",
      "Reemplazadas",
      "Desactivadas",
      "Todos los estados",
    ]);
    expect(templateListStatusFilterLabel("inactive")).toBe("Reemplazadas o desactivadas");
  });
});
