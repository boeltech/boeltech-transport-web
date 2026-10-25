import { describe, expect, it } from "vitest";

import { listMidTripAdjustLinks } from "./listMidTripAdjustLinks";

describe("listMidTripAdjustLinks (F4)", () => {
  it("devuelve los 3 deep-links en orden cuando hay capacidad", () => {
    expect(
      listMidTripAdjustLinks({
        canReplanPendingStops: true,
        canAppendCargo: true,
        canReassignFleet: true,
      }),
    ).toEqual([
      { id: "pending_stops", tab: "route" },
      { id: "add_cargo", tab: "cargo" },
      {
        id: "reassign_fleet",
        tab: "overview",
        openAssignFleet: true,
      },
    ]);
  });

  it("omite links sin capacidad", () => {
    expect(
      listMidTripAdjustLinks({
        canReplanPendingStops: false,
        canAppendCargo: true,
        canReassignFleet: false,
      }),
    ).toEqual([{ id: "add_cargo", tab: "cargo" }]);
  });

  it("vacío si no hay ningún ajuste disponible", () => {
    expect(
      listMidTripAdjustLinks({
        canReplanPendingStops: false,
        canAppendCargo: false,
        canReassignFleet: false,
      }),
    ).toEqual([]);
  });
});
