import { describe, expect, it, vi } from "vitest";
import { clientQueryKeys } from "@features/clients";
import { employeeQueryKeys } from "@features/employees";
import { vehicleQueryKeys } from "@features/vehicles";
import { driverQueryKeys } from "@features/drivers";
import { invalidateImportedMasterQueries } from "./invalidateImportedMasterQueries";

describe("invalidateImportedMasterQueries", () => {
  it("invalidates employee lists after employees import", () => {
    const invalidateQueries = vi.fn();
    const qc = { invalidateQueries } as never;

    invalidateImportedMasterQueries(qc, "employees");

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: employeeQueryKeys.lists(),
    });
  });

  it("invalidates clients after clients import", () => {
    const invalidateQueries = vi.fn();
    const qc = { invalidateQueries } as never;

    invalidateImportedMasterQueries(qc, "clients");

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: clientQueryKeys.lists(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: clientQueryKeys.active(),
    });
  });

  it("invalidates vehicles and drivers keys", () => {
    const invalidateQueries = vi.fn();
    const qc = { invalidateQueries } as never;

    invalidateImportedMasterQueries(qc, "vehicles");
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: vehicleQueryKeys.lists(),
    });

    invalidateQueries.mockClear();
    invalidateImportedMasterQueries(qc, "drivers");
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: driverQueryKeys.lists(),
    });
  });
});
