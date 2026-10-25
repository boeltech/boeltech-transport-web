import { describe, expect, it } from "vitest";
import {
  mapApiExpense,
  mapApiOperationalCashReceipt,
  mapApiOperationalCashSummary,
  mapApiTrip,
  mapApiTripListItem,
  mapApiTripRevenueSplit,
} from "./mappers";
import type {
  ApiExpenseResponse,
  ApiTripListItemResponse,
  ApiTripResponse,
} from "./api-types";

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

  it("maps false_trip principal invoice summary without primary (ADR-0079)", () => {
    const item = mapApiTripListItem({
      ...baseListItem({
        has_active_invoice: false,
        has_active_primary_invoice: false,
        has_active_principal_invoice: true,
        can_generate_invoice: false,
        can_generate_accessory_invoice: false,
        can_generate_false_trip_invoice: false,
        invoice_id: "inv-falso-1",
        invoice_folio: "B8S-99",
        invoice_status: "stamped",
        invoice_cfdi_uuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        block_reason:
          "Este viaje ya tiene una factura activa y no se puede facturar nuevamente.",
      }),
      operational_outcome: "false_trip",
    });

    expect(item.invoicing).toMatchObject({
      hasActiveInvoice: false,
      hasActivePrimaryInvoice: false,
      hasActivePrincipalInvoice: true,
      primaryTransportInvoiceId: null,
      canGenerateFalseTripInvoice: false,
      canGenerateInvoice: false,
      invoiceId: "inv-falso-1",
      invoiceFolio: "B8S-99",
      invoiceStatus: "stamped",
      invoiceCfdiUuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    });
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

describe("mapApiTrip / mapApiTripListItem route_type (ADR-0086)", () => {
  it("maps route_type on list item and defaults to long_haul when omitted", () => {
    const withLocal = mapApiTripListItem({
      ...baseListItem(undefined),
      route_type: "local",
    });
    expect(withLocal.routeType).toBe("local");

    const omitted = mapApiTripListItem(baseListItem(undefined));
    expect(omitted.routeType).toBe("long_haul");

    const transfer = mapApiTripListItem({
      ...baseListItem(undefined),
      route_type: "transfer",
    });
    expect(transfer.routeType).toBe("transfer");
  });

  it("maps route_type on detail trip", () => {
    const api = {
      id: "trip-1",
      tenant_id: "t-1",
      trip_code: "V-1",
      vehicle_id: "veh-1",
      driver_id: "drv-1",
      client_id: null,
      scheduled_departure: "2026-07-01T10:00:00.000Z",
      scheduled_arrival: null,
      actual_departure: null,
      actual_arrival: null,
      start_mileage: null,
      end_mileage: null,
      origin_city: "QRO",
      origin_state: null,
      destination_city: "CDMX",
      destination_state: null,
      cargo_description: null,
      cargo_weight: null,
      cargo_volume: null,
      cargo_units: null,
      cargo_value: null,
      base_rate: 0,
      fuel_cost: 0,
      toll_cost: 0,
      other_costs: 0,
      total_cost: 0,
      status: "draft",
      route_type: "transfer",
      notes: null,
      cancellation_reason: null,
      total_dist_rec: null,
      id_ccp: null,
      created_at: "2026-07-01T09:00:00.000Z",
      updated_at: "2026-07-01T09:00:00.000Z",
      created_by: null,
      updated_by: null,
    } as ApiTripResponse;

    expect(mapApiTrip(api).routeType).toBe("transfer");
    expect(mapApiTrip({ ...api, route_type: undefined }).routeType).toBe(
      "long_haul",
    );
  });
});

describe("mapApiExpense self-approval evidence (ADR-0098)", () => {
  const baseExpense = {
    id: "exp-1",
    tenant_id: "tenant-1",
    trip_id: "trip-1",
    category: "fuel",
    description: "Diésel",
    amount: 1500,
    currency: "MXN",
    expense_date: "2026-10-01T10:00:00.000Z",
    status: "approved",
    is_estimated: false,
    approved_by: "admin-solo",
    approved_at: "2026-10-01T12:00:00.000Z",
    rejection_reason: null,
    created_at: "2026-10-01T10:00:00.000Z",
    updated_at: "2026-10-01T12:00:00.000Z",
    created_by: "admin-solo",
    updated_by: null,
  } as unknown as ApiExpenseResponse;

  it("mapea self_segregated_approval y approver_count_at_approve", () => {
    const mapped = mapApiExpense({
      ...baseExpense,
      self_segregated_approval: true,
      approver_count_at_approve: 1,
    });
    expect(mapped.selfSegregatedApproval).toBe(true);
    expect(mapped.approverCountAtApprove).toBe(1);
    expect(mapped.createdBy).toBe("admin-solo");
  });

  it("sin campos del API queda sin evidencia de autoaprobación", () => {
    const mapped = mapApiExpense(baseExpense);
    expect(mapped.selfSegregatedApproval).toBe(false);
    expect(mapped.approverCountAtApprove).toBeNull();
  });

  it("mapea is_estimated legacy sin exigir el campo", () => {
    expect(mapApiExpense(baseExpense).isEstimated).toBe(false);
    expect(
      mapApiExpense({
        ...baseExpense,
        is_estimated: undefined,
      }).isEstimated,
    ).toBeUndefined();
  });
});

describe("mapApiOperationalCash* (ADR-0096 addendum)", () => {
  it("maps operational_cash summary snake→camel", () => {
    expect(
      mapApiOperationalCashSummary({
        status: "partial",
        collected_total: "10000.00",
        pending_amount: 14500,
        base_rate: 24500,
        receipt_count: 1,
      }),
    ).toEqual({
      status: "partial",
      collectedTotal: 10000,
      pendingAmount: 14500,
      baseRate: 24500,
      receiptCount: 1,
    });
    expect(mapApiOperationalCashSummary(null)).toBeNull();
  });

  it("maps receipt and embeds summary on trip detail", () => {
    const receipt = mapApiOperationalCashReceipt({
      id: "r1",
      trip_id: "trip-1",
      amount: 10000,
      collected_at: "2026-10-04T12:00:00.000Z",
      note: "anticipo",
      created_by: "u1",
      created_at: "2026-10-04T12:05:00.000Z",
      voided_at: null,
      voided_by: null,
      void_reason: null,
    });
    expect(receipt).toMatchObject({
      id: "r1",
      tripId: "trip-1",
      amount: 10000,
      note: "anticipo",
      voidedAt: null,
    });
    expect(receipt.collectedAt.toISOString()).toBe(
      "2026-10-04T12:00:00.000Z",
    );

    const trip = mapApiTrip({
      id: "trip-1",
      tenant_id: "t-1",
      trip_code: "V-1",
      vehicle_id: "veh-1",
      driver_id: "drv-1",
      client_id: null,
      scheduled_departure: "2026-07-01T10:00:00.000Z",
      scheduled_arrival: null,
      actual_departure: null,
      actual_arrival: null,
      start_mileage: null,
      end_mileage: null,
      origin_city: "QRO",
      origin_state: null,
      destination_city: "CDMX",
      destination_state: null,
      cargo_description: null,
      cargo_weight: null,
      cargo_volume: null,
      cargo_units: null,
      cargo_value: null,
      base_rate: 24500,
      fuel_cost: 0,
      toll_cost: 0,
      other_costs: 0,
      total_cost: 0,
      status: "completed",
      notes: null,
      cancellation_reason: null,
      total_dist_rec: null,
      id_ccp: null,
      operational_cash_amount: 10000,
      operational_cash_collected_at: "2026-10-04T12:00:00.000Z",
      operational_cash_note: null,
      operational_cash: {
        status: "partial",
        collected_total: 10000,
        pending_amount: 14500,
        base_rate: 24500,
        receipt_count: 1,
      },
      created_at: "2026-07-01T09:00:00.000Z",
      updated_at: "2026-07-01T09:00:00.000Z",
      created_by: null,
      updated_by: null,
    } as ApiTripResponse);

    expect(trip.operationalCash).toEqual({
      status: "partial",
      collectedTotal: 10000,
      pendingAmount: 14500,
      baseRate: 24500,
      receiptCount: 1,
    });
    expect(trip.operationalCashAmount).toBe(10000);
  });
});
