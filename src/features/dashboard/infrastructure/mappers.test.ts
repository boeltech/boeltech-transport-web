import { describe, expect, it } from "vitest";
import { mapBranchKpis, mapBranchKpisTrend } from "./mappers";

describe("mapBranchKpis", () => {
  it("mapea filas snake_case a camelCase", () => {
    const result = mapBranchKpis({
      period: {
        from: "2026-07-01T00:00:00.000Z",
        to: "2026-07-31T23:59:59.999Z",
        label: "Mes actual",
      },
      rows: [
        {
          branch_id: "11111111-1111-4111-8111-111111111111",
          branch_code: "SUC-N",
          branch_name: "Norte",
          trips: {
            total: 5,
            in_progress: 1,
            completed: 3,
            cancelled: 1,
          },
          fleet: {
            vehicles_total: 4,
            vehicles_available: 2,
            vehicles_on_trip: 1,
            vehicles_in_maintenance: 1,
          },
          drivers: {
            total: 6,
            available: 4,
            on_trip: 2,
          },
          financial_month: {
            trip_count: 3,
            actual_revenue: 100000,
            actual_cost: 40000,
            actual_margin: 60000,
          },
        },
        {
          branch_id: null,
          branch_code: null,
          branch_name: "Sin sucursal",
          trips: {
            total: 1,
            in_progress: 0,
            completed: 1,
            cancelled: 0,
          },
          fleet: {
            vehicles_total: 0,
            vehicles_available: 0,
            vehicles_on_trip: 0,
            vehicles_in_maintenance: 0,
          },
          drivers: {
            total: 0,
            available: 0,
            on_trip: 0,
          },
          financial_month: null,
        },
      ],
    });

    expect(result.period.label).toBe("Mes actual");
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      branchId: "11111111-1111-4111-8111-111111111111",
      branchCode: "SUC-N",
      branchName: "Norte",
      trips: {
        total: 5,
        inProgress: 1,
        completed: 3,
        cancelled: 1,
      },
      fleet: {
        vehiclesTotal: 4,
        vehiclesOnTrip: 1,
      },
      financialMonth: {
        actualMargin: 60000,
      },
    });
    expect(result.rows[1].branchId).toBeNull();
    expect(result.rows[1].financialMonth).toBeNull();
  });
});

describe("mapBranchKpisTrend", () => {
  it("mapea periods y series snake_case a camelCase", () => {
    const result = mapBranchKpisTrend({
      months: 6,
      periods: ["2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"],
      series: [
        {
          branch_id: "11111111-1111-4111-8111-111111111111",
          branch_code: "SUC-N",
          branch_name: "Norte",
          trips_completed: [1, 0, 2, 0, 1, 3],
          financial: {
            actual_revenue: [100, 0, 200, 0, 50, 300],
            actual_cost: [40, 0, 80, 0, 20, 120],
            actual_margin: [60, 0, 120, 0, 30, 180],
          },
        },
        {
          branch_id: null,
          branch_code: null,
          branch_name: "Sin sucursal",
          trips_completed: [0, 0, 0, 0, 0, 1],
          financial: null,
        },
      ],
    });

    expect(result.months).toBe(6);
    expect(result.periods).toHaveLength(6);
    expect(result.series).toHaveLength(2);
    expect(result.series[0]).toMatchObject({
      branchId: "11111111-1111-4111-8111-111111111111",
      branchCode: "SUC-N",
      branchName: "Norte",
      tripsCompleted: [1, 0, 2, 0, 1, 3],
      financial: {
        actualRevenue: [100, 0, 200, 0, 50, 300],
        actualCost: [40, 0, 80, 0, 20, 120],
        actualMargin: [60, 0, 120, 0, 30, 180],
      },
    });
    expect(result.series[1].branchId).toBeNull();
    expect(result.series[1].financial).toBeNull();
  });
});
