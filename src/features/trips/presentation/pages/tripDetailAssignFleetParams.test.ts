import { describe, expect, it } from "vitest";
import {
  TRIP_ASSIGN_FLEET_PARAM,
  TRIP_ASSIGN_FLEET_PARAM_VALUE,
  applyOpenAssignFleetSearchParams,
  clearAssignFleetSearchParams,
  wantsOpenAssignFleetSheet,
} from "./tripDetailAssignFleetParams";

describe("tripDetailAssignFleetParams (D6)", () => {
  it("detecta assignFleet=1", () => {
    expect(
      wantsOpenAssignFleetSheet(
        new URLSearchParams(`${TRIP_ASSIGN_FLEET_PARAM}=${TRIP_ASSIGN_FLEET_PARAM_VALUE}`),
      ),
    ).toBe(true);
    expect(wantsOpenAssignFleetSheet(new URLSearchParams("assignFleet=0"))).toBe(
      false,
    );
    expect(wantsOpenAssignFleetSheet(new URLSearchParams())).toBe(false);
  });

  it("fuerza tab=overview y assignFleet=1 sin perder otros params", () => {
    const next = applyOpenAssignFleetSearchParams(
      new URLSearchParams("tab=tracking&foo=1"),
    );
    expect(next.get("tab")).toBe("overview");
    expect(next.get(TRIP_ASSIGN_FLEET_PARAM)).toBe(TRIP_ASSIGN_FLEET_PARAM_VALUE);
    expect(next.get("foo")).toBe("1");
  });

  it("limpia solo assignFleet", () => {
    const next = clearAssignFleetSearchParams(
      new URLSearchParams("tab=overview&assignFleet=1"),
    );
    expect(next.get("tab")).toBe("overview");
    expect(next.get(TRIP_ASSIGN_FLEET_PARAM)).toBeNull();
  });
});
