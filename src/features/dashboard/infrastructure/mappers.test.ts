import { describe, expect, it } from "vitest";
import {
  mapActivation,
  mapBranchKpis,
  mapBranchKpisTrend,
  mapDashboard,
  mapFinancialTrend,
} from "./mappers";

describe("mapDashboard", () => {
  const baseStats = {
    vehicles: {
      total: 1,
      available: 1,
      on_trip: 0,
      in_maintenance: 0,
    },
    drivers: {
      total: 1,
      available: 1,
      on_trip: 0,
      on_vacation: 0,
      on_leave: 0,
    },
    trips: {
      total_this_month: 2,
      in_progress: 1,
      completed_this_month: 1,
      cancelled_this_month: 0,
    },
    billing: null,
    financial_month: null,
  };

  it("mapea collected_yesterday y trips_today a camelCase", () => {
    const result = mapDashboard({
      stats: { ...baseStats, collected_yesterday: 1250.5 },
      alerts: [],
      recent_trips: [{ id: "r1", trip_code: "T-1" }],
      trips_today: [
        {
          id: "t1",
          trip_code: "T-HOY",
          origin_city: "CDMX",
          destination_city: "MTY",
          status: "in_progress",
          scheduled_departure: "2026-10-17T12:00:00Z",
          driver_full_name: "Ana",
          vehicle_unit_number: "U-1",
        },
      ],
    });

    expect(result.stats.collectedYesterday).toBe(1250.5);
    expect(result.tripsToday).toHaveLength(1);
    expect(result.tripsToday[0]?.trip_code).toBe("T-HOY");
    expect(result.recent_trips).toHaveLength(1);
  });

  it("conserva null en collectedYesterday (sin finance.read)", () => {
    const result = mapDashboard({
      stats: { ...baseStats, collected_yesterday: null },
      alerts: [],
      recent_trips: [],
      trips_today: [],
    });
    expect(result.stats.collectedYesterday).toBeNull();
    expect(result.tripsToday).toEqual([]);
  });

  it("trata collected_yesterday ausente como null", () => {
    const result = mapDashboard({
      stats: baseStats,
      alerts: [],
      recent_trips: [],
    });
    expect(result.stats.collectedYesterday).toBeNull();
    expect(result.tripsToday).toEqual([]);
  });
});

describe("mapActivation", () => {
  it("mapea snake_case a camelCase", () => {
    const result = mapActivation({
      ops_level: "l1_ready",
      fiscal_track: {
        company_rfc_set: true,
        certificate_configured: false,
        ready_hint: "missing_csd",
      },
      counts: {
        clients: 1,
        vehicles: 2,
        drivers: 1,
        trips_non_cancelled: 0,
        users_non_admin: 0,
      },
      items: [
        {
          code: "client",
          status: "done",
          required_for_ops: true,
          cta_path: "/clients/new",
          can_act: true,
        },
        {
          code: "first_trip",
          status: "pending",
          required_for_ops: true,
          cta_path: "/trips/new",
          can_act: true,
        },
      ],
      demo: {
        has_demo_data: false,
        seed_available: false,
        purge_allowed: false,
      },
      dismissed: false,
    });

    expect(result.opsLevel).toBe("l1_ready");
    expect(result.fiscalTrack).toEqual({
      companyRfcSet: true,
      certificateConfigured: false,
      readyHint: "missing_csd",
    });
    expect(result.counts.tripsNonCancelled).toBe(0);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      code: "client",
      status: "done",
      requiredForOps: true,
      ctaPath: "/clients/new",
      canAct: true,
    });
    expect(result.demo.seedAvailable).toBe(false);
  });

  it("mapea flags demo seed_available y purge_allowed", () => {
    const result = mapActivation({
      ops_level: "empty",
      fiscal_track: {
        company_rfc_set: false,
        certificate_configured: false,
        ready_hint: "missing_rfc",
      },
      counts: {
        clients: 0,
        vehicles: 0,
        drivers: 0,
        trips_non_cancelled: 0,
        users_non_admin: 0,
      },
      items: [],
      demo: {
        has_demo_data: true,
        seed_available: true,
        purge_allowed: true,
      },
      dismissed: false,
    });

    expect(result.demo).toEqual({
      hasDemoData: true,
      seedAvailable: true,
      purgeAllowed: true,
    });
  });
});

describe("mapFinancialTrend", () => {
  it("mapea current_period a currentPeriod", () => {
    const result = mapFinancialTrend({
      periods: ["2025-12", "2026-01"],
      budgeted_revenue: [0, 100],
      actual_revenue: ["0", "95"],
      budgeted_cost: [0, 60],
      actual_cost: [0, 55],
      current_period: "2026-01",
    });

    expect(result.periods).toEqual(["2025-12", "2026-01"]);
    expect(result.actual_revenue).toEqual([0, 95]);
    expect(result.currentPeriod).toBe("2026-01");
  });

  it("deja currentPeriod sin definir cuando el API no lo manda", () => {
    expect(mapFinancialTrend({ periods: ["2026-01"] }).currentPeriod).toBeUndefined();
    expect(mapFinancialTrend({ current_period: "" }).currentPeriod).toBeUndefined();
  });
});

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
