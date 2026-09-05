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
  });
});
