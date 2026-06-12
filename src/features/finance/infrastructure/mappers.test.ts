import { describe, expect, it } from "vitest";
import { mapProfitabilityTripsResponse } from "./mappers";

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
