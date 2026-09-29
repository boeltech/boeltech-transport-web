import { describe, expect, it } from "vitest";

import { countVehiclePanelFilters } from "./vehicleListFilters";

describe("countVehiclePanelFilters", () => {
  it("no cuenta el padrón sin recortes de panel", () => {
    expect(countVehiclePanelFilters({ status: "", type: "", branchId: "" })).toBe(
      0,
    );
  });

  it("cuenta estado, tipo y sucursal", () => {
    expect(
      countVehiclePanelFilters({
        status: "on_trip",
        type: "truck",
        branchId: "b1",
      }),
    ).toBe(3);
  });

  it("cuenta una unidad por dimensión", () => {
    expect(
      countVehiclePanelFilters({ status: "available", type: "", branchId: "" }),
    ).toBe(1);
    expect(
      countVehiclePanelFilters({ status: "", type: "torton", branchId: "" }),
    ).toBe(1);
  });
});
