import { describe, expect, it } from "vitest";
import {
  parseInvoiceBillingScope,
  type CreateInvoicePayload,
} from "@features/invoicing/domain";
import { mapInvoice, toApiCreateInvoice } from "./mappers";

describe("invoicing mappers billing_scope (ADR-0068)", () => {
  it("mapInvoice maps trips[].billing_scope", () => {
    const invoice = mapInvoice({
      id: "inv-1",
      tenant_id: "t-1",
      serie: "A",
      folio: 1,
      status: "draft",
      issuer_rfc: "AAA010101AAA",
      issuer_name: "Emisor",
      issuer_tax_regime: "601",
      issue_location: "64000",
      receiver_rfc: "BBB010101BBB",
      receiver_name: "Receptor",
      cfdi_usage: "G03",
      receiver_tax_regime: "601",
      receiver_postal_code: "64000",
      payment_form: "99",
      payment_method: "PPD",
      currency: "MXN",
      exchange_rate: 1,
      subtotal: 500,
      discount: 0,
      total_tax: 80,
      retained_tax: 0,
      total: 580,
      balance: 580,
      notes: null,
      cfdi_uuid: null,
      stamped_at: null,
      cancelled_at: null,
      cancellation_reason: null,
      created_at: "2026-07-01T10:00:00.000Z",
      updated_at: "2026-07-01T10:00:00.000Z",
      concepts: [],
      trips: [
        {
          trip_id: "trip-1",
          trip_code: "V-1",
          client_name: "Cliente",
          scheduled_departure: "2026-07-01T10:00:00.000Z",
          origin_city: "QRO",
          origin_state: "QRO",
          destination_city: "CDMX",
          destination_state: "CMX",
          base_rate: 1000,
          billing_scope: "accessory",
        },
      ],
    });

    expect(invoice.trips[0]?.billingScope).toBe("accessory");
  });

  it("mapInvoice defaults billingScope to primary_transport", () => {
    const invoice = mapInvoice({
      id: "inv-2",
      tenant_id: "t-1",
      serie: "A",
      folio: 2,
      status: "draft",
      issuer_rfc: "AAA010101AAA",
      issuer_name: "Emisor",
      issuer_tax_regime: "601",
      issue_location: "64000",
      receiver_rfc: "BBB010101BBB",
      receiver_name: "Receptor",
      cfdi_usage: "G03",
      receiver_tax_regime: "601",
      receiver_postal_code: "64000",
      payment_form: "99",
      payment_method: "PPD",
      currency: "MXN",
      exchange_rate: 1,
      subtotal: 1000,
      discount: 0,
      total_tax: 160,
      retained_tax: 0,
      total: 1160,
      balance: 1160,
      notes: null,
      cfdi_uuid: null,
      stamped_at: null,
      cancelled_at: null,
      cancellation_reason: null,
      created_at: "2026-07-01T10:00:00.000Z",
      updated_at: "2026-07-01T10:00:00.000Z",
      concepts: [],
      trips: [
        {
          trip_id: "trip-1",
          trip_code: "V-1",
          client_name: "Cliente",
          scheduled_departure: "2026-07-01T10:00:00.000Z",
          origin_city: "QRO",
          origin_state: "QRO",
          destination_city: "CDMX",
          destination_state: "CMX",
          base_rate: 1000,
        },
      ],
    });

    expect(invoice.trips[0]?.billingScope).toBe("primary_transport");
  });

  it("mapInvoice maps trips[].billing_scope false_trip", () => {
    const invoice = mapInvoice({
      id: "inv-3",
      tenant_id: "t-1",
      serie: "A",
      folio: 3,
      status: "draft",
      issuer_rfc: "AAA010101AAA",
      issuer_name: "Emisor",
      issuer_tax_regime: "601",
      issue_location: "64000",
      receiver_rfc: "BBB010101BBB",
      receiver_name: "Receptor",
      cfdi_usage: "G03",
      receiver_tax_regime: "601",
      receiver_postal_code: "64000",
      payment_form: "99",
      payment_method: "PPD",
      currency: "MXN",
      exchange_rate: 1,
      subtotal: 12500,
      discount: 0,
      total_tax: 2000,
      retained_tax: 0,
      total: 14500,
      balance: 14500,
      notes: null,
      cfdi_uuid: null,
      stamped_at: null,
      cancelled_at: null,
      cancellation_reason: null,
      created_at: "2026-08-15T10:00:00.000Z",
      updated_at: "2026-08-15T10:00:00.000Z",
      concepts: [],
      trips: [
        {
          trip_id: "trip-1",
          trip_code: "V-1",
          client_name: "Cliente",
          scheduled_departure: "2026-08-15T10:00:00.000Z",
          origin_city: "QRO",
          origin_state: "QRO",
          destination_city: "CDMX",
          destination_state: "CMX",
          base_rate: 12500,
          billing_scope: "false_trip",
        },
      ],
    });

    expect(invoice.trips[0]?.billingScope).toBe("false_trip");
  });

  it("toApiCreateInvoice sends billing_scope false_trip", () => {
    const payload: CreateInvoicePayload = {
      tripIds: ["trip-1"],
      billingScope: "false_trip",
      receiverRfc: "BBB010101BBB",
      receiverName: "Receptor",
      cfdiUsage: "G03",
      receiverTaxRegime: "601",
      receiverPostalCode: "64000",
      paymentForm: "99",
      paymentMethod: "PPD",
      currency: "MXN",
      subtotal: 12500,
      totalTax: 2000,
      total: 14500,
    };

    expect(toApiCreateInvoice(payload)).toMatchObject({
      trip_ids: ["trip-1"],
      billing_scope: "false_trip",
    });
  });

  it("toApiCreateInvoice sends billing_scope", () => {
    const payload: CreateInvoicePayload = {
      tripIds: ["trip-1"],
      billingScope: "accessory",
      receiverRfc: "BBB010101BBB",
      receiverName: "Receptor",
      cfdiUsage: "G03",
      receiverTaxRegime: "601",
      receiverPostalCode: "64000",
      paymentForm: "99",
      paymentMethod: "PPD",
      currency: "MXN",
      subtotal: 500,
      totalTax: 80,
      total: 580,
    };

    expect(toApiCreateInvoice(payload)).toMatchObject({
      trip_ids: ["trip-1"],
      billing_scope: "accessory",
    });
  });

  it("toApiCreateInvoice defaults billing_scope to primary_transport", () => {
    const payload: CreateInvoicePayload = {
      tripIds: ["trip-1"],
      receiverRfc: "BBB010101BBB",
      receiverName: "Receptor",
      cfdiUsage: "G03",
      receiverTaxRegime: "601",
      receiverPostalCode: "64000",
      paymentForm: "99",
      paymentMethod: "PPD",
      currency: "MXN",
      subtotal: 1000,
      totalTax: 160,
      total: 1160,
    };

    expect(toApiCreateInvoice(payload).billing_scope).toBe("primary_transport");
  });
});

describe("parseInvoiceBillingScope", () => {
  it("accepts false_trip and accessory, defaults to primary_transport", () => {
    expect(parseInvoiceBillingScope("false_trip")).toBe("false_trip");
    expect(parseInvoiceBillingScope("accessory")).toBe("accessory");
    expect(parseInvoiceBillingScope("primary_transport")).toBe("primary_transport");
    expect(parseInvoiceBillingScope(undefined)).toBe("primary_transport");
    expect(parseInvoiceBillingScope("unknown")).toBe("primary_transport");
  });
});
