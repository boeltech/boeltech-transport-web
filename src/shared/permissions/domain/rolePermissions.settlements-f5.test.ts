import { describe, expect, it } from "vitest";
import { getPermissionsForRole } from "./rolePermissions.js";

/**
 * F5 R1/R4 — lockstep API `PERMISSIONS.settlements` / `PERMISSIONS.employees`.
 * R2 vive en system_default de aprobación (API); Contador conserva settlements.update.
 * R3 (activar tarifa) es guard de rol admin|manager, no de permission string.
 */
describe("rolePermissions F5 settlements / employees (R1–R4)", () => {
  it("R1: settlements.create solo admin + accountant (sin manager)", () => {
    expect(getPermissionsForRole("admin")).not.toContain("settlements.create"); // admin bypass
    expect(getPermissionsForRole("accountant")).toContain("settlements.create");
    expect(getPermissionsForRole("manager")).not.toContain("settlements.create");
    expect(getPermissionsForRole("manager")).toContain("settlements.read");
    expect(getPermissionsForRole("manager")).toContain("settlements.update");
  });

  it("R1: Contador conserva create/update/execute para armar y registrar", () => {
    const perms = getPermissionsForRole("accountant");
    expect(perms).toContain("settlements.create");
    expect(perms).toContain("settlements.update");
    expect(perms).toContain("settlements.execute");
  });

  it("R4: employees.update incluye accountant; manager sigue con update (CLABE field-guard en API/UI)", () => {
    expect(getPermissionsForRole("accountant")).toContain("employees.update");
    expect(getPermissionsForRole("accountant")).toContain("employees.read");
    expect(getPermissionsForRole("manager")).toContain("employees.update");
    expect(getPermissionsForRole("dispatcher")).not.toContain("employees.update");
  });
});
