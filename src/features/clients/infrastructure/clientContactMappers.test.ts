import { describe, expect, it } from "vitest";
import type {
  ClientContactApiResponse,
  ClientSummaryApiResponse,
  ClientCreditSummaryApiResponse,
  ClientTripHistoryItemApiResponse,
} from "../domain";
import {
  mapClientContact,
  mapClientContactList,
  mapClientSummary,
  mapClientCreditSummary,
  mapClientTripHistory,
  toApiCreateClientContact,
  toApiUpdateClientContact,
} from "./clientContactMappers";

const snakeContact: ClientContactApiResponse = {
  id: "contact-1",
  tenant_id: "tenant-1",
  client_id: "client-1",
  full_name: "Ana López",
  position: "Compras",
  email: "ana@acme.test",
  phone: "3312345678",
  secondary_phone: null,
  signs_carta_porte: true,
  receives_invoices: false,
  authorizes_payments: true,
  is_primary: true,
  is_active: true,
  notes: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
  created_by: null,
  updated_by: null,
};

describe("clientContactMappers", () => {
  it("mapClientContactList mapea lista de contactos", () => {
    const result = mapClientContactList({ data: [snakeContact] });
    expect(result).toHaveLength(1);
    expect(result[0]?.fullName).toBe("Ana López");
    expect(result[0]?.signsCartaPorte).toBe(true);
    expect(result[0]?.isPrimary).toBe(true);
  });

  it("mapClientContact mapea contacto único", () => {
    const contact = mapClientContact({ data: snakeContact });
    expect(contact.clientId).toBe("client-1");
    expect(contact.email).toBe("ana@acme.test");
  });

  it("toApiCreateClientContact serializa flags y nombre", () => {
    const payload = toApiCreateClientContact({
      fullName: "Pedro",
      signsCartaPorte: true,
      isPrimary: true,
    });
    expect(payload).toMatchObject({
      fullName: "Pedro",
      signsCartaPorte: true,
      isPrimary: true,
    });
  });

  it("toApiUpdateClientContact omite undefined", () => {
    const payload = toApiUpdateClientContact({ fullName: "Pedro" });
    expect(payload).toEqual({ fullName: "Pedro" });
    expect(payload).not.toHaveProperty("email");
  });

  it("mapClientSummary mapea KPIs", () => {
    const raw: ClientSummaryApiResponse = {
      active_trips: 2,
      total_trips: 10,
      excluded_trips: 3,
      total_revenue: 150000.5,
      avg_payment_days: 28.4,
      last_trip_at: "2026-05-01T10:00:00.000Z",
    };
    const summary = mapClientSummary({ data: raw });
    expect(summary.activeTrips).toBe(2);
    expect(summary.excludedTrips).toBe(3);
    expect(summary.totalRevenue).toBe(150000.5);
    expect(summary.avgPaymentDays).toBe(28.4);
  });

  it("mapClientCreditSummary mapea exposición y breakdown", () => {
    const raw: ClientCreditSummaryApiResponse = {
      client_id: "client-1",
      payment_terms: "credit",
      credit_days: 30,
      credit_limit: 100000,
      breakdown: {
        invoiced: 45000,
        unbilled: 12000,
        pending_draft: 3000,
      },
      total_exposure: 60000,
      available_credit: 40000,
      utilization_pct: 0.6,
      status: "ok",
      next_invoice_due_at: "2026-07-15",
    };
    const summary = mapClientCreditSummary({ data: raw });
    expect(summary.clientId).toBe("client-1");
    expect(summary.breakdown.pendingDraft).toBe(3000);
    expect(summary.breakdown.invoiced).toBe(45000);
    expect(summary.utilizationPct).toBe(0.6);
    expect(summary.status).toBe("ok");
    expect(summary.nextInvoiceDueAt).toBe("2026-07-15");
  });

  it("mapClientTripHistory mapea filas y paginación", () => {
    const row: ClientTripHistoryItemApiResponse = {
      trip_id: "trip-1",
      trip_code: "VJ-001",
      status: "completed",
      origin_label: "GDL",
      destination_label: "MTY",
      scheduled_departure: "2026-04-01T08:00:00.000Z",
      revenue: 12000,
      revenue_source: "invoice_subtotal",
      invoice_status: "stamped",
    };
    const result = mapClientTripHistory({
      data: [row],
      pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    });
    expect(result.data[0]?.tripCode).toBe("VJ-001");
    expect(result.data[0]?.revenueSource).toBe("invoice_subtotal");
    expect(result.pagination.totalPages).toBe(1);
  });
});
