import { describe, expect, it } from "vitest";

import { resolveStopFiscalUiContext } from "./fiscalCopy";

describe("resolveStopFiscalUiContext", () => {
  it("does not assume pickup when waypoint has no operation", () => {
    expect(resolveStopFiscalUiContext("waypoint", ["waypoint"])).toBe(
      "waypoint_pending_operation",
    );
    expect(resolveStopFiscalUiContext("waypoint", [])).toBe(
      "waypoint_pending_operation",
    );
  });

  it("maps pickup / delivery / both", () => {
    expect(
      resolveStopFiscalUiContext("waypoint", ["waypoint", "pickup"]),
    ).toBe("waypoint_pickup_only");
    expect(
      resolveStopFiscalUiContext("waypoint", ["waypoint", "delivery"]),
    ).toBe("waypoint_delivery_only");
    expect(
      resolveStopFiscalUiContext("waypoint", [
        "waypoint",
        "pickup",
        "delivery",
      ]),
    ).toBe("waypoint_pickup_and_delivery");
  });
});
