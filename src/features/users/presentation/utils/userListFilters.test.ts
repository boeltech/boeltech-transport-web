import { describe, expect, it } from "vitest";

import { countUserPanelFilters } from "./userListFilters";

const idle = {
  status: "",
  role: "",
  createdFrom: "",
  createdTo: "",
  lastLoginFrom: "",
  lastLoginTo: "",
};

describe("countUserPanelFilters", () => {
  it("no cuenta el padrón sin recortes de panel", () => {
    expect(countUserPanelFilters(idle)).toBe(0);
  });

  it("cuenta estado, rol y cada rango como una unidad", () => {
    expect(
      countUserPanelFilters({
        status: "active",
        role: "accountant",
        createdFrom: "2026-01-01",
        createdTo: "2026-01-31",
        lastLoginFrom: "2026-09-01",
        lastLoginTo: "2026-09-13",
      }),
    ).toBe(4);
  });

  it("cuenta el rango una sola vez aunque solo haya un extremo", () => {
    expect(
      countUserPanelFilters({
        ...idle,
        createdFrom: "2026-01-01",
      }),
    ).toBe(1);
    expect(
      countUserPanelFilters({
        ...idle,
        lastLoginTo: "2026-09-13",
      }),
    ).toBe(1);
  });
});
