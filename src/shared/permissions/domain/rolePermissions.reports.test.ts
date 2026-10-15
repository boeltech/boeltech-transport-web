import { describe, expect, it } from "vitest";
import { getPermissionsForRole } from "./rolePermissions";
import { isAdminRole } from "./rules";

describe("reports role permissions (Ola 8 — portales)", () => {
  it("denies reports.read to client and driver portals", () => {
    expect(getPermissionsForRole("client")).not.toContain("reports.read");
    expect(getPermissionsForRole("driver")).not.toContain("reports.read");
  });

  it("keeps reports.read for staff roles that use the hub", () => {
    expect(isAdminRole("admin")).toBe(true);
    for (const role of [
      "manager",
      "dispatcher",
      "accountant",
      "operator",
    ] as const) {
      expect(getPermissionsForRole(role)).toContain("reports.read");
    }
  });
});
