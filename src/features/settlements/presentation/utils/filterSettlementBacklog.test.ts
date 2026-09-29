import { describe, expect, it } from "vitest";

import type { SettlementBacklogRow } from "../../domain/entities";
import { filterSettlementBacklog } from "./filterSettlementBacklog";

function row(
  overrides: Partial<SettlementBacklogRow> = {},
): SettlementBacklogRow {
  return {
    employeeId: "e1",
    employeeFullName: "Fernando Castillo",
    branchId: "b1",
    branchName: "Monterrey",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-15",
    pendingTripsCount: 2,
    oldestTripAgeDays: 3,
    estimatedNetAmount: 1000,
    rowType: "trips_pending",
    warnings: [],
    ...overrides,
  };
}

describe("filterSettlementBacklog", () => {
  const rows = [
    row(),
    row({
      employeeId: "e2",
      employeeFullName: "Luis Nuzco",
      branchName: "Guadalajara",
    }),
  ];

  it("devuelve todas las filas si el search está vacío", () => {
    expect(filterSettlementBacklog(rows, "  ")).toHaveLength(2);
  });

  it("filtra por nombre de operador", () => {
    const result = filterSettlementBacklog(rows, "nuzco");
    expect(result).toHaveLength(1);
    expect(result[0]?.employeeFullName).toBe("Luis Nuzco");
  });

  it("filtra por nombre de sucursal", () => {
    const result = filterSettlementBacklog(rows, "monterrey");
    expect(result).toHaveLength(1);
    expect(result[0]?.employeeFullName).toBe("Fernando Castillo");
  });
});
