import { describe, expect, it } from "vitest";

import { countEmployeePanelFilters } from "./employeeListFilters";

describe("countEmployeePanelFilters", () => {
  it("no cuenta el padrón sin recortes", () => {
    expect(countEmployeePanelFilters({ status: "", type: "", position: "" })).toBe(
      0,
    );
  });

  it("cuenta una unidad por dimensión recortada", () => {
    expect(
      countEmployeePanelFilters({
        status: "on_vacation",
        type: "permanent",
        position: "Conductor",
      }),
    ).toBe(3);
  });
});
