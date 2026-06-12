import { describe, expect, it } from "vitest";
import type { Invoice } from "@features/invoicing/domain";
import type { TripStop } from "@features/trips/domain";
import {
  buildSubstitutionCorrectionsDiff,
  buildSubstitutionTripCorrectionsDiff,
  substituteInvoiceSheetSchema,
} from "./substitutionCorrectionsSchema";

const invoice = {
  receiverRfc: "XAXX010101000",
  receiverName: "PUBLICO EN GENERAL",
  receiverTaxRegime: "616",
  receiverPostalCode: "26015",
  cfdiUsage: "G03",
  paymentForm: "99",
  paymentMethod: "PUE",
  subtotal: 1000,
  discount: 0,
  totalTax: 160,
  retainedTax: 0,
  total: 1160,
} as Invoice;

describe("substituteInvoiceSheetSchema", () => {
  it("validates sheet form with correction fields", () => {
    const result = substituteInvoiceSheetSchema.safeParse({
      cancellationReason: "Motivo",
      receiver_rfc: "XAXX010101000",
      receiver_name: "PUBLICO EN GENERAL",
      receiver_tax_regime: "616",
      receiver_postal_code: "26015",
      cfdi_usage: "G03",
      payment_form: "99",
      payment_method: "PUE",
      subtotal: 1000,
      discount: 0,
      total_tax: 160,
      retained_tax: 0,
      total: 1160,
      apply_retained_tax: false,
      trip_corrections: [],
    });
    expect(result.success).toBe(true);
  });
});

describe("buildSubstitutionCorrectionsDiff", () => {
  const baseValues = {
    cancellationReason: "Motivo",
    receiver_rfc: "XAXX010101000",
    receiver_name: "PUBLICO EN GENERAL",
    receiver_tax_regime: "616",
    receiver_postal_code: "26015",
    cfdi_usage: "G03",
    payment_form: "99",
    payment_method: "PUE" as const,
    subtotal: 1000,
    discount: 0,
    total_tax: 160,
    retained_tax: 0,
    total: 1160,
    apply_retained_tax: false,
    trip_corrections: [],
  };

  const stopId = "44444444-4444-4444-4444-444444444444";
  const tripId = "22222222-2222-2222-2222-222222222222";
  const stop = {
    id: stopId,
    tripId,
    sequenceOrder: 0,
    stopType: "origin",
    deliveryRfcRemitenteDestinatario: "XAXX010101000",
    rfcRemitenteDestinatario: null,
    deliveryNombreRemitenteDestinatario: null,
    nombreRemitenteDestinatario: null,
  } as unknown as TripStop;

  it("returns undefined when nothing changed", () => {
    const diff = buildSubstitutionCorrectionsDiff(invoice, baseValues);
    expect(diff).toBeUndefined();
  });

  it("returns only changed fields", () => {
    const diff = buildSubstitutionCorrectionsDiff(invoice, {
      ...baseValues,
      receiver_rfc: "AAA010101AAA",
      cfdi_usage: "S01",
    });
    expect(diff).toEqual({
      receiverRfc: "AAA010101AAA",
      cfdiUsage: "S01",
    });
  });

  it("returns subtotal when amount changed", () => {
    const diff = buildSubstitutionCorrectionsDiff(
      invoice,
      {
        ...baseValues,
        subtotal: 1100,
        total_tax: 176,
        total: 1276,
      },
      new Map(),
      { subtotal: true },
    );
    expect(diff).toEqual({
      subtotal: 1100,
      totalTax: 176,
      total: 1276,
    });
  });

  it("omits incidental amount drift without explicit amount edits", () => {
    const invoiceWithRetention = {
      ...invoice,
      retainedTax: 1000,
      subtotal: 25000,
      totalTax: 4000,
      total: 28000,
    };
    const diff = buildSubstitutionCorrectionsDiff(invoiceWithRetention, {
      ...baseValues,
      receiver_rfc: "AAA010101AAA",
      retained_tax: 0,
      total: 29000,
    });
    expect(diff).toEqual({
      receiverRfc: "AAA010101AAA",
    });
  });

  it("omits amount corrections when only fiscal fields were edited", () => {
    const invoiceWithRetention = {
      ...invoice,
      retainedTax: 1000,
      subtotal: 25000,
      totalTax: 4000,
      total: 28000,
    };
    const diff = buildSubstitutionCorrectionsDiff(
      invoiceWithRetention,
      {
        ...baseValues,
        receiver_rfc: "AAA010101AAA",
        retained_tax: 0,
        total: 29000,
      },
      new Map(),
      { receiver_rfc: true },
    );
    expect(diff).toEqual({
      receiverRfc: "AAA010101AAA",
    });
  });

  it("returns trip_corrections when stop RFC changed", () => {
    const stopsById = new Map([[stopId, stop]]);
    const diff = buildSubstitutionCorrectionsDiff(
      invoice,
      {
        ...baseValues,
        trip_corrections: [
          {
            trip_id: tripId,
            stop_id: stopId,
            rfc_remitente_destinatario: "AAA010101AAA",
            reason: "RFC incorrecto en parada",
          },
        ],
      },
      stopsById,
    );
    expect(diff).toEqual({
      tripCorrections: [
        {
          tripId,
          stopId,
          rfcRemitenteDestinatario: "AAA010101AAA",
          reason: "RFC incorrecto en parada",
        },
      ],
    });
  });
});

describe("buildSubstitutionTripCorrectionsDiff", () => {
  const stopId = "44444444-4444-4444-4444-444444444444";
  const tripId = "22222222-2222-2222-2222-222222222222";
  const stop = {
    id: stopId,
    tripId,
    sequenceOrder: 0,
    stopType: "origin",
    deliveryRfcRemitenteDestinatario: "XAXX010101000",
    rfcRemitenteDestinatario: null,
    deliveryNombreRemitenteDestinatario: null,
    nombreRemitenteDestinatario: null,
  } as unknown as TripStop;

  it("ignores entries without RFC change", () => {
    const diff = buildSubstitutionTripCorrectionsDiff(
      new Map([[stopId, stop]]),
      [
        {
          trip_id: tripId,
          stop_id: stopId,
          rfc_remitente_destinatario: "XAXX010101000",
          reason: "Sin cambio real",
        },
      ],
    );
    expect(diff).toBeUndefined();
  });
});
