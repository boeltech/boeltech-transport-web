import { describe, expect, it } from "vitest";

import { countDriverPanelFilters } from "./driverListFilters";

describe("countDriverPanelFilters", () => {
  it("no cuenta el padrón sin recortes de panel", () => {
    expect(countDriverPanelFilters({ status: "", branchId: "" })).toBe(0);
  });

  it("cuenta estado y sucursal, no licencias", () => {
    expect(
      countDriverPanelFilters({
        status: "on_trip",
        branchId: "b1",
      }),
    ).toBe(2);
  });
});
