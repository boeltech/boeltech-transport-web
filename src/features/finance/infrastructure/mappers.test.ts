import { describe, expect, it } from "vitest";
import {
  mapAgingSummary,
  mapAccountStatementItem,
  mapFinanceSummary,
  mapMonthlyPerformance,
  mapProfitabilityTripsResponse,
} from "./mappers";
import { getAccountStatementDisplayPaid } from "../presentation/utils/accountStatementDisplayPaid";

describe("mapProfitabilityTripsResponse", () => {
  it("maps scope aggregates and trip bucket fields", () => {
    const result = mapProfitabilityTripsResponse({
      data: [
        {
          trip_id: "t1",
          trip_code: "V-001",
          client_name: "Acme",
          vehicle_id: "v1",
          driver_id: "d1",
          origin_city: "GDL",
          destination_city: "MTY",
          scheduled_departure: "2026-06-01T10:00:00.000Z",
          trip_status: "in_progress",
          financial_bucket: "in_progress",
          recognized_revenue: 0,
          projected_revenue: 0,
          revenue: 0,
          revenue_source: "trip_base_rate",
          cancelled_invoice_revenue: 5000,
          actual_total: 500,
          gross_margin: null,
          gross_margin_pct: null,
          profitability_status: null,
          has_pending_expenses: false,
          snapshot_refreshed_at: "2026-06-01T12:00:00.000Z",
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
      aggregates: {
        total_revenue: 4000,
        total_actual: 1200,
        blended_margin: 2800,
        blended_margin_pct: 70,
        total_projected_revenue: 3000,
        total_cancellation_loss: 250,
        total_cancelled_invoice_revenue: 5000,
        by_profitability_status: {
          high: 1,
          medium: 0,
          low: 0,
          breakeven: 0,
          loss: 0,
        },
      },
    });

    expect(result.aggregates.totalProjectedRevenue).toBe(3000);
    expect(result.aggregates.totalCancellationLoss).toBe(250);
    expect(result.aggregates.totalCancelledInvoiceRevenue).toBe(5000);
    expect(result.data[0]?.revenueSource).toBe("trip_base_rate");
    expect(result.data[0]?.cancelledInvoiceRevenue).toBe(5000);
    expect(result.data[0]?.financialBucket).toBe("in_progress");
    expect(result.data[0]?.snapshotRefreshedAt).toBe("2026-06-01T12:00:00.000Z");
    expect(result.data[0]?.grossMargin).toBeNull();
    expect(result.data[0]?.profitabilityStatus).toBeNull();
  });

  it("maps ADR-0108 operational fields and margin_basis meta", () => {
    const result = mapProfitabilityTripsResponse({
      data: [
        {
          trip_id: "t1",
          trip_code: "V-001",
          client_name: "Acme",
          vehicle_id: "v1",
          driver_id: "d1",
          origin_city: "GDL",
          destination_city: "MTY",
          scheduled_departure: "2026-06-01T10:00:00.000Z",
          trip_status: "completed",
          financial_bucket: "realized",
          revenue: 1000,
          actual_total: 400,
          trip_commission_total: 100,
          operational_cost: 500,
          gross_margin: 600,
          operational_margin: 500,
          gross_margin_pct: 60,
          operational_margin_pct: 50,
          profitability_status: "high",
          operational_profitability_status: "medium",
          has_pending_expenses: false,
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
      aggregates: {
        total_revenue: 1000,
        total_actual: 400,
        blended_margin: 600,
        blended_margin_pct: 60,
        total_trip_commission: 100,
        total_operational_cost: 500,
        blended_operational_margin: 500,
        blended_operational_margin_pct: 50,
        total_projected_revenue: 0,
        total_cancellation_loss: 0,
        total_cancelled_invoice_revenue: 0,
        by_profitability_status: {
          high: 1,
          medium: 0,
          low: 0,
          breakeven: 0,
          loss: 0,
        },
      },
      meta: { margin_basis: "operational" },
    });

    expect(result.marginBasis).toBe("operational");
    expect(result.data[0]?.tripCommissionTotal).toBe(100);
    expect(result.data[0]?.operationalCost).toBe(500);
    expect(result.data[0]?.operationalMargin).toBe(500);
    expect(result.data[0]?.operationalProfitabilityStatus).toBe("medium");
    expect(result.aggregates.totalOperationalCost).toBe(500);
    expect(result.aggregates.blendedOperationalMarginPct).toBe(50);
  });
});

describe("mapFinanceSummary", () => {
  it("maps total_receivable as Por cobrar (allocations ancla)", () => {
    const summary = mapFinanceSummary({
      total_receivable: 1160,
      collected_this_month: 500,
      total_overdue: 200,
      expenses_this_month: 80,
      invoices_by_status: {
        draft: 1,
        stamped: 4,
        cancellation_pending: 0,
        cancelled: 2,
      },
    });
    expect(summary.totalReceivable).toBe(1160);
    expect(summary.collectedThisMonth).toBe(500);
    expect(summary.totalOverdue).toBe(200);
  });
});

describe("mapAccountStatementItem", () => {
  it("maps balance_due as cartera remaining; Pagado is invoiced minus due, not total_paid", () => {
    const row = mapAccountStatementItem({
      client_rfc: "XAXX010101000",
      client_name: "PUBLICO EN GENERAL",
      total_invoiced: 31920,
      total_paid: 0,
      balance_due: 0,
      invoice_count: 2,
      open_invoice_count: 1,
      overdue_amount: 0,
    });
    expect(row.balanceDue).toBe(0);
    expect(row.totalPaid).toBe(0);
    expect(row.invoiceCount).toBe(2);
    expect(row.openInvoiceCount).toBe(1);
    expect(getAccountStatementDisplayPaid(row)).toBe(31920);
    expect(getAccountStatementDisplayPaid(row)).not.toBe(row.totalPaid);
  });

  it("defaults openInvoiceCount to 0 when open_invoice_count is omitted", () => {
    const row = mapAccountStatementItem({
      client_rfc: "XAXX010101000",
      client_name: "PUBLICO EN GENERAL",
      total_invoiced: 1000,
      total_paid: 0,
      balance_due: 1000,
      invoice_count: 3,
      overdue_amount: 0,
    });
    expect(row.openInvoiceCount).toBe(0);
    expect(row.invoiceCount).toBe(3);
  });
});

describe("mapMonthlyPerformance", () => {
  it("maps current and previous periods to camelCase keeping index alignment", () => {
    const result = mapMonthlyPerformance({
      periods: ["2026-09", "2026-10"],
      current: [
        {
          period: "2026-09",
          actual_revenue: 1000,
          actual_cost: 600,
          actual_margin: 400,
          trip_count: 2,
        },
        {
          period: "2026-10",
          actual_revenue: "1500.50",
          actual_cost: "500.25",
          actual_margin: "1000.25",
          trip_count: "3",
        },
      ],
      previous: [
        {
          period: "2025-09",
          actual_revenue: 800,
          actual_cost: 500,
          actual_margin: 300,
          trip_count: 1,
        },
        {
          period: "2025-10",
          actual_revenue: 0,
          actual_cost: 0,
          actual_margin: 0,
          trip_count: 0,
        },
      ],
    });

    expect(result.periods).toEqual(["2026-09", "2026-10"]);
    expect(result.current[0]).toEqual({
      period: "2026-09",
      actualRevenue: 1000,
      actualCost: 600,
      actualMargin: 400,
      tripCount: 2,
      incompleteTripCount: 0,
      tripsWithPendingExpenses: 0,
      provisional: false,
      operationalCost: undefined,
      operationalMargin: undefined,
      periodPersonnelCost: undefined,
    });
    expect(result.current[1]?.actualRevenue).toBe(1500.5);
    expect(result.current[1]?.tripCount).toBe(3);
    expect(result.previous[0]?.period).toBe("2025-09");
    expect(result.previous[1]?.actualMargin).toBe(0);
  });

  it("maps provisional signals from the API without recalculating OR", () => {
    const result = mapMonthlyPerformance({
      periods: ["2026-09"],
      current: [
        {
          period: "2026-09",
          actual_revenue: 1000,
          actual_cost: 600,
          actual_margin: 400,
          trip_count: 2,
          incomplete_trip_count: 1,
          trips_with_pending_expenses: 2,
          provisional: true,
        },
      ],
      previous: [
        {
          period: "2025-09",
          actual_revenue: 800,
          actual_cost: 500,
          actual_margin: 300,
          trip_count: 1,
          incomplete_trip_count: 0,
          trips_with_pending_expenses: 0,
          provisional: false,
        },
      ],
    });

    expect(result.current[0]).toMatchObject({
      incompleteTripCount: 1,
      tripsWithPendingExpenses: 2,
      provisional: true,
    });
    expect(result.previous[0]).toMatchObject({
      incompleteTripCount: 0,
      tripsWithPendingExpenses: 0,
      provisional: false,
    });
  });

  it("maps ADR-0108 operational_cost and period_personnel_cost", () => {
    const result = mapMonthlyPerformance({
      periods: ["2026-09"],
      current: [
        {
          period: "2026-09",
          actual_revenue: 1000,
          actual_cost: 700,
          actual_margin: 300,
          operational_cost: 700,
          operational_margin: 300,
          period_personnel_cost: 150,
          trip_count: 2,
        },
      ],
      previous: [
        {
          period: "2025-09",
          actual_revenue: 800,
          actual_cost: 500,
          actual_margin: 300,
          operational_cost: 500,
          operational_margin: 300,
          period_personnel_cost: 0,
          trip_count: 1,
        },
      ],
      meta: { margin_basis: "operational" },
    });

    expect(result.marginBasis).toBe("operational");
    expect(result.current[0]).toMatchObject({
      operationalCost: 700,
      operationalMargin: 300,
      periodPersonnelCost: 150,
    });
  });

  it("maps trip_expenses_cost and trip_commission_cost; absent stays undefined", () => {
    const result = mapMonthlyPerformance({
      periods: ["2026-09"],
      current: [
        {
          period: "2026-09",
          actual_revenue: 1000,
          actual_cost: 700,
          actual_margin: 300,
          operational_cost: 700,
          operational_margin: 300,
          trip_expenses_cost: "450.50",
          trip_commission_cost: 249.5,
          trip_count: 2,
        },
      ],
      previous: [
        {
          period: "2025-09",
          actual_revenue: 0,
          actual_cost: 0,
          actual_margin: 0,
          trip_count: 0,
        },
      ],
      meta: { margin_basis: "trip_expenses" },
    });

    expect(result.marginBasis).toBe("trip_expenses");
    expect(result.current[0]).toMatchObject({
      tripExpensesCost: 450.5,
      tripCommissionCost: 249.5,
    });
    expect(result.previous[0]?.tripExpensesCost).toBeUndefined();
    expect(result.previous[0]?.tripCommissionCost).toBeUndefined();
  });

  it("defaults provisional fields when the payload omits them", () => {
    const result = mapMonthlyPerformance({
      periods: ["2026-09"],
      current: [
        {
          period: "2026-09",
          actual_revenue: 100,
          actual_cost: 40,
          actual_margin: 60,
          trip_count: 1,
        },
      ],
      previous: [],
    });
    expect(result.current[0]).toMatchObject({
      incompleteTripCount: 0,
      tripsWithPendingExpenses: 0,
      provisional: false,
    });
  });

  it("returns empty arrays when the payload is incomplete", () => {
    expect(mapMonthlyPerformance({})).toEqual({
      periods: [],
      current: [],
      previous: [],
    });
  });
});

describe("mapAgingSummary", () => {
  it("maps total_receivable from aging (same ancla as Por cobrar)", () => {
    const aging = mapAgingSummary({
      total_receivable: 2320,
      dso_30d: 18,
      buckets: {
        "0-30": { invoice_count: 1, total_balance: 1160 },
        "31-60": { invoice_count: 1, total_balance: 1160 },
        "61-90": { invoice_count: 0, total_balance: 0 },
        "90+": { invoice_count: 0, total_balance: 0 },
      },
    });
    expect(aging.totalReceivable).toBe(2320);
    expect(aging.dso30d).toBe(18);
    expect(aging.buckets["0-30"].totalBalance).toBe(1160);
  });
});
