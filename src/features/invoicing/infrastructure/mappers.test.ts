import { describe, expect, it } from "vitest";
import {
  parseInvoiceBillingScope,
  type CreateInvoicePayload,
} from "@features/invoicing/domain";
import {
  mapInvoice,
  mapInvoiceListItem,
  mapSendInvoiceBatchResult,
  mapSendBatchPollResult,
  toApiCreateInvoice,
  toApiSendInvoice,
  toApiSendInvoiceBatch,
} from "./mappers";

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
    expect(parseInvoiceBillingScope("split_share")).toBe("split_share");
  });
});


describe("toApiCreateInvoice split_share (ADR-0081)", () => {
  it("maps split_leg_id and attach_carta_porte", () => {
    const api = toApiCreateInvoice({
      tripIds: ["trip-1"],
      billingScope: "split_share",
      splitLegId: "leg-1",
      attachCartaPorte: true,
      receiverRfc: "AAA010101AAA",
      receiverName: "Cliente",
      cfdiUsage: "G03",
      receiverTaxRegime: "601",
      receiverPostalCode: "64000",
      paymentForm: "99",
      paymentMethod: "PPD",
      currency: "MXN",
      subtotal: 100,
      totalTax: 16,
      total: 116,
    });
    expect(api.billing_scope).toBe("split_share");
    expect(api.split_leg_id).toBe("leg-1");
    expect(api.attach_carta_porte).toBe(true);
  });
});

describe("invoicing mappers can_cancel_invoice", () => {
  const baseRaw = {
    id: "inv-cancel-flag",
    tenant_id: "t-1",
    serie: "A",
    folio: 9,
    status: "stamped",
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
    balance_due: 580,
    total_paid: 0,
    notes: null,
    cfdi_uuid: "c9b54a4b-c44f-4fd6-afeb-a6889f4ad073",
    stamped_at: "2026-07-01T10:00:00.000Z",
    cancelled_at: null,
    cancellation_reason: null,
    created_at: "2026-07-01T10:00:00.000Z",
    updated_at: "2026-07-01T10:00:00.000Z",
    concepts: [],
    trips: [],
    payments: [],
    sat_cancellation_status: "none",
    sat_cancellation_message: null,
    pac_provider: null,
    xml_content: null,
    qr_code: null,
    pdf_url: null,
    issued_at: "2026-07-01T10:00:00.000Z",
    created_by: null,
    updated_by: null,
    created_by_name: null,
    updated_by_name: null,
  };

  it("mapInvoice maps can_cancel_invoice true/false", () => {
    expect(
      mapInvoice({ ...baseRaw, can_cancel_invoice: true }).canCancelInvoice,
    ).toBe(true);
    expect(
      mapInvoice({ ...baseRaw, can_cancel_invoice: false }).canCancelInvoice,
    ).toBe(false);
  });

  it("mapInvoice leaves canCancelInvoice undefined when API omits the flag", () => {
    expect(mapInvoice(baseRaw).canCancelInvoice).toBeUndefined();
  });
});

describe("invoicing mappers dispatch_sent_at", () => {
  it("mapInvoice maps dispatch_sent_at", () => {
    const invoice = mapInvoice({
      id: "inv-1",
      tenant_id: "t-1",
      serie: "A",
      folio: 1,
      status: "stamped",
      dispatch_sent_at: "2026-08-20T15:00:00.000Z",
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
      stamped_at: "2026-08-20T14:00:00.000Z",
      cancelled_at: null,
      created_at: "2026-07-01T10:00:00.000Z",
      updated_at: "2026-07-01T10:00:00.000Z",
      concepts: [],
      trips: [],
      payments: [],
      total_paid: 0,
      balance_due: 580,
    });

    expect(invoice.dispatchSentAt).toBe("2026-08-20T15:00:00.000Z");
  });

  it("mapInvoice maps auto_dispatch failed", () => {
    const invoice = mapInvoice({
      id: "inv-1",
      tenant_id: "t-1",
      serie: "A",
      folio: 1,
      status: "stamped",
      dispatch_sent_at: null,
      auto_dispatch: {
        enabled_for_client: true,
        last_scheduled_run_id: "run-1",
        last_item_status: "failed",
        last_error: "SMTP down",
      },
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
      stamped_at: "2026-08-20T14:00:00.000Z",
      cancelled_at: null,
      created_at: "2026-07-01T10:00:00.000Z",
      updated_at: "2026-07-01T10:00:00.000Z",
      concepts: [],
      trips: [],
      payments: [],
      total_paid: 0,
      balance_due: 580,
    });

    expect(invoice.autoDispatch).toEqual({
      enabledForClient: true,
      lastScheduledRunId: "run-1",
      lastItemStatus: "failed",
      lastError: "SMTP down",
    });
  });
});

describe("mapInvoiceListItem email dispatch fields", () => {
  const listBase = {
    id: "inv-1",
    tenant_id: "t-1",
    serie: "A",
    folio: 10,
    cfdi_uuid: null,
    receiver_rfc: "BBB010101BBB",
    receiver_name: "Receptor SA",
    issued_at: "2026-08-20T14:00:00.000Z",
    payment_form: "99",
    payment_method: "PPD",
    currency: "MXN",
    subtotal: 500,
    total_tax: 80,
    total: 580,
    status: "stamped",
    sat_cancellation_status: "none",
    sat_cancellation_message: null,
    stamped_at: "2026-08-20T14:00:00.000Z",
    trip_count: 1,
    trip_codes: ["V-1"],
    total_paid: 0,
    balance_due: 580,
    created_at: "2026-07-01T10:00:00.000Z",
    created_by_name: null,
  };

  it("maps client_id, client_name, dispatch_sent_at and auto_dispatch", () => {
    const item = mapInvoiceListItem({
      ...listBase,
      client_id: "client-1",
      client_name: "Cliente Comercial",
      dispatch_sent_at: null,
      auto_dispatch: {
        enabled_for_client: true,
        last_scheduled_run_id: "run-9",
        last_item_status: "failed",
        last_error: "SMTP down",
      },
    });

    expect(item.clientId).toBe("client-1");
    expect(item.clientName).toBe("Cliente Comercial");
    expect(item.dispatchSentAt).toBeNull();
    expect(item.autoDispatch).toEqual({
      enabledForClient: true,
      lastScheduledRunId: "run-9",
      lastItemStatus: "failed",
      lastError: "SMTP down",
    });
  });

  it("defaults missing client fields to null and omits autoDispatch when absent", () => {
    const item = mapInvoiceListItem(listBase);

    expect(item.clientId).toBeNull();
    expect(item.clientName).toBeNull();
    expect(item.dispatchSentAt).toBeNull();
    expect(item.autoDispatch).toBeUndefined();
  });
});

describe("toApiSendInvoice", () => {
  it("omits body when recipientKeys is undefined (all eligible)", () => {
    expect(toApiSendInvoice({})).toEqual({});
    expect(toApiSendInvoice({ recipientKeys: undefined })).toEqual({});
  });

  it("sends empty array when recipientKeys is [] (API 422)", () => {
    expect(toApiSendInvoice({ recipientKeys: [] })).toEqual({
      recipient_keys: [],
    });
  });

  it("sends subset keys", () => {
    expect(
      toApiSendInvoice({ recipientKeys: ["billing_email", "contact:abc"] }),
    ).toEqual({
      recipient_keys: ["billing_email", "contact:abc"],
    });
  });
});

describe("toApiSendInvoiceBatch / mapSendInvoiceBatchResult", () => {
  it("maps camelCase groups to snake_case body", () => {
    expect(
      toApiSendInvoiceBatch({
        groups: [
          { invoiceIds: ["a", "b"], recipientKeys: ["billing_email"] },
          { invoiceIds: ["c"] },
        ],
      }),
    ).toEqual({
      groups: [
        { invoice_ids: ["a", "b"], recipient_keys: ["billing_email"] },
        { invoice_ids: ["c"] },
      ],
    });
  });

  it("maps API 202 batch result to camelCase (queued ack)", () => {
    expect(
      mapSendInvoiceBatchResult({
        batch_id: "batch-1",
        status: "queued",
        groups: [
          {
            group_key: "client-a",
            client_id: "client-a",
            status: "queued",
            error_message: null,
            error_code: null,
            invoice_ids: ["inv-1", "inv-2"],
          },
          {
            group_key: "client-b",
            client_id: "client-b",
            status: "skipped",
            error_message: "Sin destinatarios",
            error_code: "NO_RECIPIENTS",
            invoice_ids: ["inv-3"],
          },
        ],
        summary: {
          clients_queued: 1,
          clients_skipped: 1,
          clients_failed: 0,
          invoices_queued: 2,
        },
      }),
    ).toEqual({
      batchId: "batch-1",
      status: "queued",
      groups: [
        {
          groupKey: "client-a",
          clientId: "client-a",
          status: "queued",
          errorMessage: null,
          errorCode: null,
          invoiceIds: ["inv-1", "inv-2"],
        },
        {
          groupKey: "client-b",
          clientId: "client-b",
          status: "skipped",
          errorMessage: "Sin destinatarios",
          errorCode: "NO_RECIPIENTS",
          invoiceIds: ["inv-3"],
        },
      ],
      summary: {
        clientsQueued: 1,
        clientsSkipped: 1,
        clientsFailed: 0,
        invoicesQueued: 2,
      },
    });
  });
});

describe("mapSendBatchPollResult", () => {
  it("maps poll status and groups to camelCase", () => {
    expect(
      mapSendBatchPollResult({
        batch_id: "batch-1",
        status: "completed_with_errors",
        groups: [
          {
            group_key: "client-a",
            client_id: "client-a",
            status: "sent",
            error_code: null,
            error_message: null,
            invoice_ids: ["inv-1"],
          },
          {
            group_key: "client-b",
            client_id: null,
            status: "failed",
            error_code: "SMTP",
            error_message: "timeout",
            invoice_ids: ["inv-2"],
          },
        ],
      }),
    ).toEqual({
      batchId: "batch-1",
      status: "completed_with_errors",
      groups: [
        {
          groupKey: "client-a",
          clientId: "client-a",
          status: "sent",
          errorCode: null,
          errorMessage: null,
          invoiceIds: ["inv-1"],
        },
        {
          groupKey: "client-b",
          clientId: null,
          status: "failed",
          errorCode: "SMTP",
          errorMessage: "timeout",
          invoiceIds: ["inv-2"],
        },
      ],
    });
  });
});
