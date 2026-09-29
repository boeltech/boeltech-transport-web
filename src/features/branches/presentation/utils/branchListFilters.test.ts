import { describe, expect, it } from "vitest";

import { countBranchPanelFilters } from "./branchListFilters";

describe("countBranchPanelFilters", () => {
  it("no cuenta el padrón sin recortes de panel", () => {
    expect(
      countBranchPanelFilters({
        status: "",
        isMain: "",
        createdFrom: "",
        createdTo: "",
      }),
    ).toBe(0);
  });

  it("cuenta estado, tipo y el rango de alta como una unidad", () => {
    expect(
      countBranchPanelFilters({
        status: "active",
        isMain: "true",
        createdFrom: "2026-01-01",
        createdTo: "2026-01-31",
      }),
    ).toBe(3);
  });

  it("cuenta el rango una sola vez aunque solo haya un extremo", () => {
    expect(
      countBranchPanelFilters({
        status: "",
        isMain: "",
        createdFrom: "2026-01-01",
        createdTo: "",
      }),
    ).toBe(1);
    expect(
      countBranchPanelFilters({
        status: "",
        isMain: "",
        createdFrom: "",
        createdTo: "2026-01-31",
      }),
    ).toBe(1);
  });
});
