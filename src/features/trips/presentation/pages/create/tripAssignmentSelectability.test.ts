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

  it("does not clear driver when post-keep canBeAssigned is true", () => {
    expect(
      shouldClearDriverSelection(
        { canBeAssigned: true },
        { allowExpiredDocs: false, inBranchScope: true },
      ),
    ).toBe(false);
  });

  it("does not clear softBusy driver", () => {
    expect(
      shouldClearDriverSelection(
        { canBeAssigned: true, softBusy: true },
        { allowExpiredDocs: false, inBranchScope: true },
      ),
    ).toBe(false);
    expect(
      isDriverSelectableWithFilters(
        { canBeAssigned: true, softBusy: true },
        { allowExpiredDocs: false, inBranchScope: true },
      ),
    ).toBe(true);
  });

  it("blocks softBusy+expiredDocs vehicle when toggle is off", () => {
    expect(
      isVehicleSelectableWithFilters(
        {
          canBeAssigned: true,
          softBusy: true,
          expiredDocsOverridable: true,
        },
        { allowExpiredDocs: false, inBranchScope: true },
      ),
    ).toBe(false);
    expect(
      isVehicleSelectableWithFilters(
        {
          canBeAssigned: true,
          softBusy: true,
          expiredDocsOverridable: true,
        },
        { allowExpiredDocs: true, inBranchScope: true },
      ),
    ).toBe(true);
  });

  it("blocks softBusy+expiredDocs driver when toggle is off", () => {
    expect(
      isDriverSelectableWithFilters(
        {
          canBeAssigned: true,
          softBusy: true,
          expiredDocsOverridable: true,
        },
        { allowExpiredDocs: false, inBranchScope: true },
      ),
    ).toBe(false);
    expect(
      isDriverSelectableWithFilters(
        {
          canBeAssigned: true,
          softBusy: true,
          expiredDocsOverridable: true,
        },
        { allowExpiredDocs: true, inBranchScope: true },
      ),
    ).toBe(true);
  });

  it("keeps keepId-style expired vehicle when toggle is off (canBeAssigned, no softBusy)", () => {
    expect(
      isVehicleSelectableWithFilters(
        { canBeAssigned: true, expiredDocsOverridable: true },
        { allowExpiredDocs: false, inBranchScope: true },
      ),
    ).toBe(true);
  });
});
