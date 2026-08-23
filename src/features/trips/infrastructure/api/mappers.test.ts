import { describe, expect, it } from "vitest";
import { mapApiTripListItem, mapApiTripRevenueSplit } from "./mappers";
import type { ApiTripListItemResponse } from "./api-types";

function baseListItem(
  invoicing: ApiTripListItemResponse["invoicing"],
): ApiTripListItemResponse {
  return {
    id: "trip-1",
    trip_code: "V-1",
    vehicle_id: "veh-1",
    vehicle_unit_number: "U-1",
    vehicle_license_plate: "ABC-123",
    driver_id: "drv-1",
    driver_full_name: "Driver",
    client_id: "cli-1",
    client_legal_name: "Cliente SA",
    origin_city: "QRO",
    origin_state: "QRO",
    destination_city: "CDMX",
    destination_state: "CMX",
    scheduled_departure: "2026-07-01T10:00:00.000Z",
    scheduled_arrival: null,
    status: "completed",
    cargo_description: null,
    base_rate: 1000,
    total_cost: 0,
    total_revenue: 1000,
    estimated_profit: 1000,
    cargo_count: 1,
    client_count: 1,
    created_at: "2026-07-01T09:00:00.000Z",
    invoicing,
  };
}

describe("mapApiTripListItem invoicing (ADR-0068)", () => {
  it("maps primary + accessory flags and accessory_invoices", () => {
    const item = mapApiTripListItem(
      baseListItem({
        has_active_invoice: true,
        has_active_primary_invoice: true,
        can_generate_invoice: false,
        can_generate_accessory_invoice: true,
        invoice_id: "inv-primary",
        invoice_folio: "A-1",
        invoice_status: "stamped",
        accessory_invoices: [
          {
            id: "inv-acc-1",
            folio: "A-2",
            status: "draft",
            total: 500,
          },
        ],
      }),
    );

    expect(item.invoicing).toMatchObject({
      hasActiveInvoice: true,
      hasActivePrimaryInvoice: true,
      canGenerateInvoice: false,
      canGenerateAccessoryInvoice: true,
      invoiceId: "inv-primary",
      invoiceFolio: "A-1",
      accessoryInvoices: [
        { id: "inv-acc-1", folio: "A-2", status: "draft", total: 500 },
      ],
    });
  });

  it("maps false_trip outcome and can_generate_false_trip_invoice (ADR-0079)", () => {
    const item = mapApiTripListItem({
      ...baseListItem({
        has_active_invoice: false,
        has_active_primary_invoice: false,
        has_active_principal_invoice: false,
        can_generate_invoice: false,
        can_generate_accessory_invoice: false,
        can_generate_false_trip_invoice: true,
      }),
      operational_outcome: "false_trip",
      false_trip_declared_at: "2026-08-15T18:40:00.000Z",
      false_trip_declared_by: "Ana Dispatcher",
    });

    expect(item.invoicing.canGenerateFalseTripInvoice).toBe(true);
    expect(item.invoicing.canGenerateInvoice).toBe(false);
    expect(item.invoicing.canGenerateAccessoryInvoice).toBe(false);
    expect(item.invoicing.hasActivePrincipalInvoice).toBe(false);
    expect(item.operationalOutcome).toBe("false_trip");
    expect(item.falseTripDeclaredAt?.toISOString()).toBe(
      "2026-08-15T18:40:00.000Z",
    );
    expect(item.falseTripDeclaredBy).toBe("Ana Dispatcher");
  });

  it("defaults operational_outcome to standard and false-trip flag to false", () => {
    const item = mapApiTripListItem(
      baseListItem({
        has_active_invoice: false,
        can_generate_invoice: true,
      }),
    );

    expect(item.operationalOutcome).toBe("standard");
    expect(item.falseTripDeclaredAt).toBeNull();
    expect(item.falseTripDeclaredBy).toBeNull();
    expect(item.invoicing.canGenerateFalseTripInvoice).toBe(false);
    expect(item.invoicing.hasActivePrincipalInvoice).toBe(false);
  });

  it("falls back has_active_primary_invoice from has_active_invoice", () => {
    const item = mapApiTripListItem(
      baseListItem({
        has_active_invoice: true,
        can_generate_invoice: false,
        invoice_id: "inv-1",
      }),
    );

    expect(item.invoicing.hasActivePrimaryInvoice).toBe(true);
    expect(item.invoicing.hasActiveInvoice).toBe(true);
    expect(item.invoicing.accessoryInvoices).toEqual([]);
  });

  it("maps ADR-0081 split invoicing flags", () => {
    const item = mapApiTripListItem(
      baseListItem({
        has_active_invoice: false,
        can_generate_invoice: false,
        has_active_split: true,
        split_legs_invoiced: 1,
        split_legs_total: 2,
        can_generate_split_share_invoice: true,
        can_generate_accessory_invoice: true,
        carta_porte_attached: false,
      }),
    );

    expect(item.invoicing).toMatchObject({
      hasActiveSplit: true,
      splitLegsInvoiced: 1,
      splitLegsTotal: 2,
      canGenerateSplitShareInvoice: true,
      canGenerateAccessoryInvoice: true,
      cartaPorteAttached: false,
      canGenerateInvoice: false,
    });
  });

  it("defaults ADR-0081 split flags when absent", () => {
    const item = mapApiTripListItem(
      baseListItem({
        has_active_invoice: false,
        can_generate_invoice: true,
      }),
    );

    expect(item.invoicing.hasActiveSplit).toBe(false);
    expect(item.invoicing.splitLegsInvoiced).toBe(0);
    expect(item.invoicing.splitLegsTotal).toBe(0);
    expect(item.invoicing.canGenerateSplitShareInvoice).toBe(false);
    expect(item.invoicing.cartaPorteAttached).toBe(false);
  });
});

describe("mapApiTripRevenueSplit (ADR-0081)", () => {
  it("maps split agreement and legs", () => {
    const split = mapApiTripRevenueSplit({
      id: "split-1",
      trip_id: "trip-1",
      status: "active",
      basis_amount: 100000,
      currency: "MXN",
      notes: "Grupo piloto",
      legs: [
        {
          id: "leg-a",
          client_id: "cli-a",
          client_legal_name: "Cliente A",
          client_rfc: "AAA010101AAA",
          share_percent: 60,
          sort_order: 0,
          suggested_carta_porte: true,
          invoice_id: null,
        },
        {
          id: "leg-b",
          client_id: "cli-b",
          client_legal_name: "Cliente B",
          client_rfc: "BBB010101BBB",
          share_percent: 40,
          sort_order: 1,
          suggested_carta_porte: false,
          invoice_id: "inv-b",
        },
      ],
      created_at: "2026-08-21T12:00:00.000Z",
      updated_at: "2026-08-21T13:00:00.000Z",
    });

    expect(split).toMatchObject({
      id: "split-1",
      tripId: "trip-1",
      status: "active",
      basisAmount: 100000,
      currency: "MXN",
      notes: "Grupo piloto",
    });
    expect(split.legs).toEqual([
      {
        id: "leg-a",
        clientId: "cli-a",
        clientLegalName: "Cliente A",
        clientRfc: "AAA010101AAA",
        sharePercent: 60,
        sortOrder: 0,
        suggestedCartaPorte: true,
        invoiceId: null,
      },
      {
        id: "leg-b",
        clientId: "cli-b",
        clientLegalName: "Cliente B",
        clientRfc: "BBB010101BBB",
        sharePercent: 40,
        sortOrder: 1,
        suggestedCartaPorte: false,
        invoiceId: "inv-b",
      },
    ]);
  });
});
