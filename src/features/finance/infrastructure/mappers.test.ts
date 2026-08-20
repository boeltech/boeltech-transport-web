import { describe, expect, it } from "vitest";
import {
  mapAgingSummary,
  mapAccountStatementItem,
  mapFinanceSummary,
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
    expect(result.data[0]?.grossMargin).toBeNull();
    expect(result.data[0]?.profitabilityStatus).toBeNull();
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
      overdue_amount: 0,
    });
    expect(row.balanceDue).toBe(0);
    expect(row.totalPaid).toBe(0);
    expect(getAccountStatementDisplayPaid(row)).toBe(31920);
    expect(getAccountStatementDisplayPaid(row)).not.toBe(row.totalPaid);
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
