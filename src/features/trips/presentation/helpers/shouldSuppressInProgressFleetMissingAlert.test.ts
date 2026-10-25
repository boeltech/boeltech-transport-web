import { describe, expect, it } from "vitest";

import { shouldSuppressInProgressFleetMissingAlert } from "./shouldSuppressInProgressFleetMissingAlert";

describe("shouldSuppressInProgressFleetMissingAlert (F11b / D27)", () => {
  it("supprime la card cuando el strip incluye reassign_fleet", () => {
    expect(
      shouldSuppressInProgressFleetMissingAlert([
        { id: "pending_stops" },
        { id: "reassign_fleet" },
      ]),
    ).toBe(true);
  });

  it("no suprime cuando el strip no tiene reassign_fleet", () => {
    expect(
      shouldSuppressInProgressFleetMissingAlert([
        { id: "pending_stops" },
        { id: "add_cargo" },
      ]),
    ).toBe(false);
  });

  it("no suprime cuando no hay strip (links vacíos)", () => {
    expect(shouldSuppressInProgressFleetMissingAlert([])).toBe(false);
  });
});
