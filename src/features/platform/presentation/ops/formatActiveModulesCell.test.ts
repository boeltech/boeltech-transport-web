import { describe, expect, it } from "vitest";
import { formatActiveModulesCell } from "./formatActiveModulesCell";

describe("formatActiveModulesCell", () => {
  const resolve = (code: string) =>
    code === "gps_tracking" ? "Seguimiento GPS" : code;

  it("shows dash when count is 0", () => {
    expect(formatActiveModulesCell(0, [], resolve)).toBe("—");
  });

  it("shows count and up to two names", () => {
    expect(
      formatActiveModulesCell(1, ["gps_tracking"], resolve),
    ).toBe("1 · Seguimiento GPS");
    expect(
      formatActiveModulesCell(2, ["gps_tracking", "other"], resolve),
    ).toBe("2 · Seguimiento GPS, other");
  });

  it("appends +N when more than two", () => {
    expect(
      formatActiveModulesCell(
        3,
        ["gps_tracking", "other", "third"],
        resolve,
      ),
    ).toBe("3 · Seguimiento GPS, other +1");
  });
});
