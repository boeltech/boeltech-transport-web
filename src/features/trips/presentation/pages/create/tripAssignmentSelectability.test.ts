import { describe, expect, it } from "vitest";

import {
  isDriverSelectableWithFilters,
  isVehicleSelectableWithFilters,
  shouldClearDriverSelection,
  shouldClearVehicleSelection,
} from "./tripAssignmentSelectability";

describe("tripAssignmentSelectability", () => {
  it("allows expired-docs vehicle only when toggle is on", () => {
    const vehicle = {
      canBeAssigned: false,
      expiredDocsOverridable: true,
    };

    expect(
      isVehicleSelectableWithFilters(vehicle, {
        allowExpiredDocs: false,
        inBranchScope: true,
      }),
    ).toBe(false);
    expect(
      isVehicleSelectableWithFilters(vehicle, {
        allowExpiredDocs: true,
        inBranchScope: true,
      }),
    ).toBe(true);
  });

  it("clears vehicle when expired-docs toggle turns off", () => {
    expect(
      shouldClearVehicleSelection(
        { canBeAssigned: false, expiredDocsOverridable: true },
        { allowExpiredDocs: false, inBranchScope: true },
      ),
    ).toBe(true);
  });

  it("clears vehicle when branch filter excludes it", () => {
    expect(
      shouldClearVehicleSelection(
        { canBeAssigned: true },
        { allowExpiredDocs: false, inBranchScope: false },
      ),
    ).toBe(true);
  });

  it("keeps fully assignable vehicle when filters are default", () => {
    expect(
      shouldClearVehicleSelection(
        { canBeAssigned: true },
        { allowExpiredDocs: false, inBranchScope: true },
      ),
    ).toBe(false);
  });

  it("clears driver with expired license when toggle turns off", () => {
    expect(
      shouldClearDriverSelection(
        { canBeAssigned: false, expiredDocsOverridable: true },
        { allowExpiredDocs: false, inBranchScope: true },
      ),
    ).toBe(true);
    expect(
      isDriverSelectableWithFilters(
        { canBeAssigned: false, expiredDocsOverridable: true },
        { allowExpiredDocs: true, inBranchScope: true },
      ),
    ).toBe(true);
  });
});
