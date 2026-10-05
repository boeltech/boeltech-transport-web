import { describe, expect, it } from "vitest";
import { mapBacklogRow, mapWorkbenchResponse } from "./mappers";

describe("settlement workbench mappers", () => {
  it("maps backlog row snake_case payload", () => {
    const row = mapBacklogRow({
      employee_id: "emp-1",
      employee_full_name: "Juan Pérez",
      branch_id: "branch-1",
      branch_name: "Monterrey",
      period_start: "2026-08-25",
      period_end: "2026-08-31",
      pending_trips_count: 3,
      oldest_trip_age_days: 5,
      estimated_net_amount: 4200.5,
      row_type: "trips_pending",
      warnings: ["open_advance"],
      employment_type: "permanent",
    });

    expect(row.employeeId).toBe("emp-1");
    expect(row.branchName).toBe("Monterrey");
    expect(row.estimatedNetAmount).toBe(4200.5);
    expect(row.warnings).toEqual(["open_advance"]);
    expect(row.periodOverlap).toBeNull();
  });

  it("maps period_overlap enrich to camelCase", () => {
    const row = mapBacklogRow({
      employee_id: "emp-2",
      employee_full_name: "Ana López",
      period_start: "2026-08-25",
      period_end: "2026-08-31",
      pending_trips_count: 1,
      oldest_trip_age_days: 2,
      row_type: "trips_pending",
      warnings: ["period_overlap"],
      period_overlap: {
        settlement_id: "stl-9",
        status: "pending_approval",
        settlement_number: "LIQ-2026-009",
        conflicts_count: 2,
      },
    });

    expect(row.periodOverlap).toEqual({
      settlementId: "stl-9",
      status: "pending_approval",
      settlementNumber: "LIQ-2026-009",
      conflictsCount: 2,
    });
  });

  it("E11: mapea folio, fechas, tipo de solape y fecha sugerida", () => {
    const row = mapBacklogRow({
      employee_id: "emp-2",
      employee_full_name: "Ana López",
      period_start: "2026-08-25",
      period_end: "2026-08-31",
      pending_trips_count: 0,
      oldest_trip_age_days: 0,
      row_type: "salary_close",
      warnings: ["period_overlap"],
      period_overlap: {
        settlement_id: "stl-9",
        status: "draft",
        settlement_number: "LIQ-2026-009",
        conflicts_count: 1,
        period_start: "2026-08-20",
        period_end: "2026-08-27",
        created_at: "2026-08-28T15:00:00.000Z",
        overlap_kind: "partial",
      },
      suggested_period_start: "2026-08-28",
    });

    expect(row.periodOverlap).toMatchObject({
      periodStart: "2026-08-20",
      periodEnd: "2026-08-27",
      createdAt: "2026-08-28T15:00:00.000Z",
      overlapKind: "partial",
    });
    expect(row.suggestedPeriodStart).toBe("2026-08-28");
  });

  it("maps period_overlap null and absent as null (F1 compat)", () => {
    const withNull = mapBacklogRow({
      employee_id: "emp-3",
      employee_full_name: "Luis Nuzco",
      period_start: "2026-08-25",
      period_end: "2026-08-31",
      pending_trips_count: 0,
      oldest_trip_age_days: 0,
      row_type: "salary_close",
      warnings: ["period_overlap"],
      period_overlap: null,
    });
    expect(withNull.periodOverlap).toBeNull();

    const absent = mapBacklogRow({
      employee_id: "emp-4",
      employee_full_name: "María Ruiz",
      period_start: "2026-08-25",
      period_end: "2026-08-31",
      pending_trips_count: 0,
      oldest_trip_age_days: 0,
      row_type: "salary_close",
      warnings: ["period_overlap"],
    });
    expect(absent.periodOverlap).toBeNull();
  });

  it("maps workbench response with summary and backlog", () => {
    const result = mapWorkbenchResponse({
      summary: {
        pending: 2,
        draft: 1,
        approval: 0,
        payable: 4,
        closed: 10,
        open_advances: 3,
      },
      backlog: [
        {
          employee_id: "emp-1",
          employee_full_name: "Ana López",
          period_start: "2026-08-25",
          period_end: "2026-08-31",
          pending_trips_count: 0,
          oldest_trip_age_days: 0,
          row_type: "salary_close",
          warnings: [],
        },
      ],
    });

    expect(result.summary.payable).toBe(4);
    expect(result.backlog).toHaveLength(1);
    expect(result.backlog[0]?.rowType).toBe("salary_close");
    expect(result.backlog[0]?.periodOverlap).toBeNull();
  });
});
