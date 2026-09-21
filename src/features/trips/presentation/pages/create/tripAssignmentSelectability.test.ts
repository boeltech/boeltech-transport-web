import { describe, expect, it } from "vitest";

import {
  isDriverSelectableWithFilters,
  isExpiredDocsGroupMember,
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

  it("grandfathers keep-current expired+softBusy when toggle is off", () => {
    expect(
      isVehicleSelectableWithFilters(
        {
          id: "veh-current",
          canBeAssigned: true,
          softBusy: true,
          expiredDocsOverridable: true,
        },
        {
          allowExpiredDocs: false,
          inBranchScope: true,
          keepResourceId: "veh-current",
        },
      ),
    ).toBe(true);
    expect(
      shouldClearVehicleSelection(
        {
          id: "veh-current",
          canBeAssigned: false,
          softBusy: true,
          expiredDocsOverridable: true,
        },
        {
          allowExpiredDocs: false,
          inBranchScope: true,
          keepResourceId: "veh-current",
        },
      ),
    ).toBe(false);
  });

  it("still clears a different expired vehicle when keepResourceId is set", () => {
    expect(
      shouldClearVehicleSelection(
        {
          id: "veh-other",
          canBeAssigned: false,
          expiredDocsOverridable: true,
        },
        {
          allowExpiredDocs: false,
          inBranchScope: true,
          keepResourceId: "veh-current",
        },
      ),
    ).toBe(true);
  });

  it("does not grandfather fleetHardBlocked even with keepResourceId", () => {
    expect(
      isVehicleSelectableWithFilters(
        {
          id: "veh-current",
          canBeAssigned: false,
          expiredDocsOverridable: true,
          fleetHardBlocked: true,
        },
        {
          allowExpiredDocs: true,
          inBranchScope: true,
          keepResourceId: "veh-current",
        },
      ),
    ).toBe(false);
  });

  it("does not liberate hard-block vehicle (sin vigencia / no registrado) when toggle is on", () => {
    const hardBlocked = { canBeAssigned: false as const };
    expect(
      isVehicleSelectableWithFilters(hardBlocked, {
        allowExpiredDocs: true,
        inBranchScope: true,
      }),
    ).toBe(false);
    expect(
      shouldClearVehicleSelection(hardBlocked, {
        allowExpiredDocs: true,
        inBranchScope: true,
      }),
    ).toBe(true);
  });

  it("does not liberate hard-block driver when toggle is on", () => {
    const hardBlocked = { canBeAssigned: false as const };
    expect(
      isDriverSelectableWithFilters(hardBlocked, {
        allowExpiredDocs: true,
        inBranchScope: true,
      }),
    ).toBe(false);
  });

  it("does not liberate fleetHardBlocked vehicle even with expired-docs toggle on", () => {
    const occupied = {
      canBeAssigned: false as const,
      expiredDocsOverridable: true as const,
      fleetHardBlocked: true as const,
    };
    expect(
      isVehicleSelectableWithFilters(occupied, {
        allowExpiredDocs: true,
        inBranchScope: true,
      }),
    ).toBe(false);
    expect(isExpiredDocsGroupMember(occupied, true)).toBe(false);
    expect(
      shouldClearVehicleSelection(occupied, {
        allowExpiredDocs: true,
        inBranchScope: true,
      }),
    ).toBe(true);
  });

  it("does not liberate fleetHardBlocked driver even with expired-docs toggle on", () => {
    const occupied = {
      canBeAssigned: false as const,
      expiredDocsOverridable: true as const,
      fleetHardBlocked: true as const,
    };
    expect(
      isDriverSelectableWithFilters(occupied, {
        allowExpiredDocs: true,
        inBranchScope: true,
      }),
    ).toBe(false);
    expect(isExpiredDocsGroupMember(occupied, true)).toBe(false);
  });

  it("keeps available+expired in expired-docs group when toggle is on", () => {
    expect(
      isExpiredDocsGroupMember(
        {
          canBeAssigned: false,
          expiredDocsOverridable: true,
        },
        true,
      ),
    ).toBe(true);
  });
});
