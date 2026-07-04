import { describe, expect, it } from "vitest";
import type { Invoice } from "@features/invoicing/domain";
import type { TripStop } from "@features/trips/domain";
import {
  buildSubstitutionConceptsDiff,
  buildSubstitutionCorrectionsDiff,
  buildSubstitutionTripCorrectionsDiff,
  defaultSubstituteInvoiceSheetValues,
  invoiceHasConcepts,
  substituteInvoiceSheetSchema,
} from "./substitutionCorrectionsSchema";
import type { InvoiceConcept } from "@features/invoicing/domain";
import type { InvoiceConceptFormLine } from "./invoiceFormSchema";

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
      concepts: [],
      trip_corrections: [],
      propagate_receiver_to_client: false,
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
    concepts: [],
    trip_corrections: [],
    propagate_receiver_to_client: false,
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
      new Map(),
      { subtotal: true },
    );
    expect(diff).toEqual({
      subtotal: 1100,
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
      new Map(),
      { receiver_rfc: true },
    );
    expect(diff).toEqual({
      receiverRfc: "AAA010101AAA",
    });
  });

  it("includes propagateReceiverToClient when checkbox set and fiscal fields changed", () => {
    const diff = buildSubstitutionCorrectionsDiff(invoice, {
      ...baseValues,
      receiver_rfc: "AAA010101AAA",
      propagate_receiver_to_client: true,
    });
    expect(diff).toEqual({
      receiverRfc: "AAA010101AAA",
      propagateReceiverToClient: true,
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
      new Map(),
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

describe("substitución multi-concepto", () => {
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
    concepts: [],
    trip_corrections: [],
    propagate_receiver_to_client: false,
  };

  const fleteConcept: InvoiceConcept = {
    conceptType: "flete",
    claveProdServ: "78101800",
    claveUnidad: "E48",
    unidad: "Servicio",
    description: "Flete",
    quantity: 1,
    unitPrice: 10000,
    amount: 10000,
    objectImp: "02",
    ivaRate: 0.16,
    retainedIvaRate: 0.04,
  };

  const multiConceptInvoice = {
    ...invoice,
    subtotal: 10000,
    totalTax: 1600,
    retainedTax: 400,
    total: 11200,
    concepts: [fleteConcept],
  } as Invoice;

  const fleteFormLine: InvoiceConceptFormLine = {
    concept_type: "flete",
    clave_prod_serv: "78101800",
    clave_unidad: "E48",
    unidad: "Servicio",
    description: "Flete",
    quantity: 1,
    unit_price: 10000,
    amount: 10000,
    object_imp: "02",
    iva_rate: 0.16,
    retained_iva_rate: 0.04,
  };

  const serviceFormLine: InvoiceConceptFormLine = {
    concept_type: "service",
    clave_prod_serv: "78101803",
    clave_unidad: "E48",
    unidad: "Servicio",
    description: "Maniobras",
    quantity: 1,
    unit_price: 2000,
    amount: 2000,
    object_imp: "02",
    iva_rate: 0.16,
    retained_iva_rate: 0.04,
  };

  it("invoiceHasConcepts distingue factura multi-concepto de legacy", () => {
    expect(invoiceHasConcepts(multiConceptInvoice)).toBe(true);
    expect(invoiceHasConcepts(invoice)).toBe(false);
  });

  it("defaultSubstituteInvoiceSheetValues inicializa conceptos desde la factura", () => {
    const values = defaultSubstituteInvoiceSheetValues(multiConceptInvoice);
    expect(values.concepts).toHaveLength(1);
    expect(values.concepts[0]?.concept_type).toBe("flete");
    expect(values.concepts[0]?.amount).toBe(10000);
  });

  it("buildSubstitutionConceptsDiff devuelve undefined cuando no cambian", () => {
    const diff = buildSubstitutionConceptsDiff(multiConceptInvoice, [
      fleteFormLine,
    ]);
    expect(diff).toBeUndefined();
  });

  it("buildSubstitutionConceptsDiff devuelve snapshot al agregar servicio", () => {
    const diff = buildSubstitutionConceptsDiff(multiConceptInvoice, [
      fleteFormLine,
      serviceFormLine,
    ]);
    expect(diff).toHaveLength(2);
    expect(diff?.[1]?.conceptType).toBe("service");
    expect(diff?.[1]?.amount).toBe(2000);
  });

  it("buildSubstitutionConceptsDiff ignora facturas legacy sin conceptos", () => {
    expect(buildSubstitutionConceptsDiff(invoice, [fleteFormLine])).toBeUndefined();
  });

  it("buildSubstitutionCorrectionsDiff envía corrections.concepts y omite escalares", () => {
    const diff = buildSubstitutionCorrectionsDiff(
      multiConceptInvoice,
      {
        ...baseValues,
        subtotal: 10000,
        total_tax: 1600,
        retained_tax: 400,
        total: 11200,
        concepts: [fleteFormLine, serviceFormLine],
      },
      new Map(),
      new Map(),
      { subtotal: true },
    );
    expect(diff?.concepts).toHaveLength(2);
    expect(diff?.subtotal).toBeUndefined();
    expect(diff?.total).toBeUndefined();
  });

  it("buildSubstitutionCorrectionsDiff cambia importe de flete", () => {
    const diff = buildSubstitutionCorrectionsDiff(multiConceptInvoice, {
      ...baseValues,
      concepts: [{ ...fleteFormLine, unit_price: 12000, amount: 12000 }],
    });
    expect(diff?.concepts).toHaveLength(1);
    expect(diff?.concepts?.[0]?.amount).toBe(12000);
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
      new Map(),
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

  it("includes trip fiscal correction when driver changed", () => {
    const trip = {
      id: tripId,
      driverId: "old-driver",
      vehicleId: "old-vehicle",
    } as unknown as import("@features/trips/domain").Trip;

    const diff = buildSubstitutionTripCorrectionsDiff(
      new Map(),
      new Map([[tripId, trip]]),
      [
        {
          trip_id: tripId,
          driver_id: "new-driver",
          reason: "Corregir operador",
        },
      ],
    );

    expect(diff).toEqual([
      {
        tripId,
        driverId: "new-driver",
        reason: "Corregir operador",
      },
    ]);
  });
});
