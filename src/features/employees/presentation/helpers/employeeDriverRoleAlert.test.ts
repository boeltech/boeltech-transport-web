import { describe, expect, it } from "vitest";
import { buildEmployeeDriverRoleAlert } from "./employeeDriverRoleAlert";
import type { EmployeeDriverRole } from "../../domain/entities";

const baseRole = (overrides: Partial<EmployeeDriverRole>): EmployeeDriverRole => ({
  driverId: "drv-1",
  driverStatus: "available",
  activeTripCount: 0,
  activeTripCodes: [],
  blocksEmployeeTermination: false,
  ...overrides,
});

describe("buildEmployeeDriverRoleAlert", () => {
  it("shows info when driver is active without blockers", () => {
    const alert = buildEmployeeDriverRoleAlert(baseRole({}));
    expect(alert.severity).toBe("info");
    expect(alert.title).toMatch(/conductor activo/i);
    expect(alert.items.some((i) => String(i.text).includes("automáticamente"))).toBe(
      true,
    );
  });

  it("shows warning when employee termination is blocked", () => {
    const alert = buildEmployeeDriverRoleAlert(
      baseRole({
        driverStatus: "on_trip",
        blocksEmployeeTermination: true,
      }),
    );
    expect(alert.severity).toBe("warning");
    expect(alert.items.some((i) => String(i.text).includes("No podrá"))).toBe(true);
  });
});
