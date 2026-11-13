import { describe, expect, it } from "vitest";
import {
  mapOperationalCashPendingResponse,
  mapOperationalCashPendingTrip,
  type ApiOperationalCashPendingResponseRaw,
  type ApiOperationalCashPendingTripRaw,
} from "./operationalCashPendingMappers";

const rawTrip: ApiOperationalCashPendingTripRaw = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "V-2026-001",
  status: "in_progress",
  client_id: "22222222-2222-4222-8222-222222222222",
  client_name: "Transportes Demo",
  base_rate: 24500,
  scheduled_departure: "2026-11-01T14:00:00.000Z",
  operational_cash: {
    status: "partial",
    collected_total: 10000,
    pending_amount: 14500,
    receipt_count: 1,
  },
};

describe("mapOperationalCashPendingTrip", () => {
  it("maps snake_case to camelCase", () => {
    const trip = mapOperationalCashPendingTrip(rawTrip);
    expect(trip).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      code: "V-2026-001",
      status: "in_progress",
      clientId: "22222222-2222-4222-8222-222222222222",
      clientName: "Transportes Demo",
      baseRate: 24500,
      scheduledDeparture: "2026-11-01T14:00:00.000Z",
      operationalCash: {
        status: "partial",
        collectedTotal: 10000,
        pendingAmount: 14500,
        receiptCount: 1,
      },
      lastActiveReceipt: null,
    });
  });

  it("maps last_active_receipt when present", () => {
    const trip = mapOperationalCashPendingTrip({
      ...rawTrip,
      last_active_receipt: {
        payment_instrument: "transfer",
        reference: "SPEI 1",
        batch_id: "batch-1",
        collected_at: "2026-11-01T18:00:00.000Z",
      },
    });
    expect(trip.lastActiveReceipt).toEqual({
      paymentInstrument: "transfer",
      reference: "SPEI 1",
      batchId: "batch-1",
      collectedAt: "2026-11-01T18:00:00.000Z",
    });
  });
});

describe("mapOperationalCashPendingResponse", () => {
  it("maps data, meta.by_client, meta.totals and pagination", () => {
    const raw: ApiOperationalCashPendingResponseRaw = {
      data: [rawTrip],
      meta: {
        totals: {
          pending_amount: 14500,
          trip_count: 1,
          client_count: 1,
        },
        by_client: [
          {
            client_id: "22222222-2222-4222-8222-222222222222",
            client_name: "Transportes Demo",
            pending_amount: 14500,
            trip_count: 1,
          },
        ],
        eligibility: {
          intent: "sin_cfdi_efectivo",
          pending_gt: 0,
          statuses: ["scheduled", "in_progress", "completed"],
        },
      },
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    };

    const result = mapOperationalCashPendingResponse(raw);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.code).toBe("V-2026-001");
    expect(result.meta.totals).toEqual({
      pendingAmount: 14500,
      tripCount: 1,
      clientCount: 1,
    });
    expect(result.meta.byClient).toEqual([
      {
        clientId: "22222222-2222-4222-8222-222222222222",
        clientName: "Transportes Demo",
        pendingAmount: 14500,
        tripCount: 1,
      },
    ]);
    expect(result.meta.eligibility.intent).toBe("sin_cfdi_efectivo");
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });
});
