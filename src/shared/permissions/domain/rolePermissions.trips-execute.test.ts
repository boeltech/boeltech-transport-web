import { describe, expect, it } from "vitest";
import { getPermissionsForRole } from "./rolePermissions.js";

describe("trips.execute role permissions (ADR-0079)", () => {
  it("includes trips.execute for driver (API lockstep)", () => {
    expect(getPermissionsForRole("driver")).toContain("trips.execute");
  });

  it("includes trips.execute for manager, dispatcher and operator", () => {
    expect(getPermissionsForRole("manager")).toContain("trips.execute");
    expect(getPermissionsForRole("dispatcher")).toContain("trips.execute");
    expect(getPermissionsForRole("operator")).toContain("trips.execute");
  });

  it("excludes trips.execute from accountant", () => {
    expect(getPermissionsForRole("accountant")).not.toContain("trips.execute");
  });

  it("excludes trips.execute from client", () => {
    expect(getPermissionsForRole("client")).not.toContain("trips.execute");
  });
});
