import { createInvoiceSchema } from "@boeltech/cfdi-domain/validadores/invoice";
import {
  tripCorrectionEntrySchema,
  type TripCorrectionEntry as TripCorrectionFormEntry,
} from "@boeltech/cfdi-domain/validadores/trip-stop-fiscal";
import type { TripStop, Trip } from "@features/trips/domain";
import {
  getEffectiveStopNombre,
  getEffectiveStopRfc,
} from "@features/trips/presentation/components/trip-fiscal/tripFiscalHelpers";
import { z } from "zod";
import type {
  Invoice,
  InvoiceConcept,
  SubstituteStampedInvoiceCorrections,
  TripCorrectionEntry,
} from "@features/invoicing/domain";
import {
  defaultFleteConceptFormLine,
  invoiceConceptFormSchema,
  inferRetentionRequired,
  mapFormConceptToPayload,
  mapInvoiceConceptToFormInput,
  refinePersonaMoralRetention,
  type InvoiceConceptFormLine,
} from "./invoiceFormSchema";

export const RETAINED_TAX_RATE = 0.04;

const retainedTaxUx = z.object({
  apply_retained_tax: z.boolean(),
  retention_required: z.boolean().optional().default(false),
});

export const substitutionCorrectionFormFieldsSchema = createInvoiceSchema
  .pick({
    receiver_rfc: true,
    receiver_name: true,
    receiver_tax_regime: true,
    receiver_postal_code: true,
    cfdi_usage: true,
    payment_form: true,
    payment_method: true,
    subtotal: true,
    discount: true,
    total_tax: true,
    retained_tax: true,
    total: true,
  })
  .extend(retainedTaxUx.shape);

export type { TripCorrectionFormEntry };

/** Tipo explícito: evita inferencia rota al combinar schemas del paquete con Zod local. */
export type SubstituteInvoiceSheetValues = {
  cancellationReason: string;
  notes?: string;
  receiver_rfc: string;
  receiver_name: string;
  receiver_tax_regime: string;
  receiver_postal_code: string;
  cfdi_usage: string;
  payment_form: string;
  payment_method: "PUE" | "PPD";
  subtotal: number;
  discount: number;
  total_tax: number;
  retained_tax: number;
  total: number;
  apply_retained_tax: boolean;
  retention_required?: boolean;
  concepts: InvoiceConceptFormLine[];
  trip_corrections: TripCorrectionFormEntry[];
  propagate_receiver_to_client: boolean;
};

const tripCorrectionFormEntrySchema =
  tripCorrectionEntrySchema as unknown as z.ZodType<TripCorrectionFormEntry>;

const substituteInvoiceSheetUxSchema = z.object({
  cancellationReason: z
    .string()
    .min(1, "Describe el motivo (se envía al SAT como parte de la cancelación 01)")
    .max(500),
  notes: z.string().max(500).optional(),
  concepts: z.array(invoiceConceptFormSchema).default([]),
  trip_corrections: z.array(tripCorrectionFormEntrySchema).default([]),
  propagate_receiver_to_client: z.boolean().default(false),
});

export const substituteInvoiceSheetSchema = (
  substitutionCorrectionFormFieldsSchema as unknown as z.ZodObject<z.ZodRawShape>
)
  .merge(substituteInvoiceSheetUxSchema)
  .superRefine((values, ctx) => {
    refinePersonaMoralRetention(
      values as {
        retention_required?: boolean;
        concepts: InvoiceConceptFormLine[];
        retained_tax: number;
      },
      ctx,
    );
  }) as unknown as z.ZodType<SubstituteInvoiceSheetValues>;

type WritableSubstituteCorrections = {
  -readonly [K in keyof SubstituteStampedInvoiceCorrections]: SubstituteStampedInvoiceCorrections[K];
};

const FISCAL_FIELD_PAIRS = [
  ["receiverRfc", "receiver_rfc"],
  ["receiverName", "receiver_name"],
  ["receiverTaxRegime", "receiver_tax_regime"],
  ["receiverPostalCode", "receiver_postal_code"],
  ["cfdiUsage", "cfdi_usage"],
  ["paymentForm", "payment_form"],
  ["paymentMethod", "payment_method"],
] as const satisfies ReadonlyArray<
  [keyof SubstituteStampedInvoiceCorrections, keyof SubstituteInvoiceSheetValues]
>;

const AMOUNT_FIELD_PAIRS = [
  ["subtotal", "subtotal"],
  ["discount", "discount"],
  ["totalTax", "total_tax"],
  ["retainedTax", "retained_tax"],
  ["total", "total"],
] as const satisfies ReadonlyArray<
  [keyof SubstituteStampedInvoiceCorrections, keyof SubstituteInvoiceSheetValues]
>;

const SUBSTITUTION_AMOUNT_DIRTY_KEYS = [
  "subtotal",
  "discount",
  "total_tax",
  "retained_tax",
  "total",
  "apply_retained_tax",
] as const satisfies ReadonlyArray<keyof SubstituteInvoiceSheetValues>;

export type SubstitutionCorrectionsDirtyFields = Partial<
  Record<keyof SubstituteInvoiceSheetValues, boolean | undefined>
>;

export function hasSubstitutionAmountDirtyFields(
  dirtyFields?: SubstitutionCorrectionsDirtyFields,
): boolean {
  if (!dirtyFields) {
    return false;
  }
  return SUBSTITUTION_AMOUNT_DIRTY_KEYS.some((key) => Boolean(dirtyFields[key]));
}

function numbersEqual(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100);
}

/** Una factura multi-concepto trae partidas explícitas; legacy solo tiene importe agregado. */
export function invoiceHasConcepts(invoice: Invoice): boolean {
  return (invoice.concepts?.length ?? 0) > 0;
}

export function buildSubstitutionConceptFormLines(
  invoice: Invoice,
): InvoiceConceptFormLine[] {
  if (invoiceHasConcepts(invoice)) {
    return invoice.concepts!.map(mapInvoiceConceptToFormInput);
  }
  return [defaultFleteConceptFormLine(invoice.subtotal ?? 0)];
}

export function defaultSubstituteInvoiceSheetValues(
  invoice: Invoice,
  options?: { clientType?: string | null },
): SubstituteInvoiceSheetValues {
  const retentionRequired = inferRetentionRequired({
    clientType: options?.clientType,
    retainedTax: invoice.retainedTax,
    receiverRfc: invoice.receiverRfc,
    concepts: invoice.concepts,
  });
  return {
    cancellationReason: "",
    notes: "",
    receiver_rfc: invoice.receiverRfc ?? "",
    receiver_name: invoice.receiverName ?? "",
    receiver_tax_regime: invoice.receiverTaxRegime ?? "",
    receiver_postal_code: invoice.receiverPostalCode ?? "",
    cfdi_usage: invoice.cfdiUsage ?? "S01",
    payment_form: invoice.paymentForm ?? "99",
    payment_method: (invoice.paymentMethod ?? "PUE") as "PUE" | "PPD",
    subtotal: invoice.subtotal ?? 0,
    discount: invoice.discount ?? 0,
    total_tax: invoice.totalTax ?? 0,
    retained_tax: invoice.retainedTax ?? 0,
    total: invoice.total ?? 0,
    apply_retained_tax: retentionRequired || (invoice.retainedTax ?? 0) > 0,
    retention_required: retentionRequired,
    concepts: buildSubstitutionConceptFormLines(invoice),
    trip_corrections: [],
    propagate_receiver_to_client: false,
  };
}

function conceptFormLinesEqualOriginal(
  original: InvoiceConcept[],
  next: InvoiceConceptFormLine[],
): boolean {
  if (original.length !== next.length) {
    return false;
  }
  return original.every((line, index) => {
    const candidate = next[index];
    if (!candidate) return false;
    return (
      line.conceptType === candidate.concept_type &&
      (line.serviceConceptId ?? undefined) ===
        (candidate.service_concept_id ?? undefined) &&
      line.claveProdServ === candidate.clave_prod_serv &&
      line.claveUnidad === candidate.clave_unidad &&
      line.unidad === candidate.unidad &&
      line.description === candidate.description &&
      numbersEqual(line.quantity, candidate.quantity) &&
      numbersEqual(line.unitPrice, candidate.unit_price) &&
      numbersEqual(line.amount, candidate.amount)
    );
  });
}

/** Devuelve el snapshot completo de partidas solo si difiere del original. */
export function buildSubstitutionConceptsDiff(
  invoice: Invoice,
  concepts: InvoiceConceptFormLine[] | undefined,
): InvoiceConcept[] | undefined {
  if (!invoiceHasConcepts(invoice) || !concepts || concepts.length === 0) {
    return undefined;
  }
  if (conceptFormLinesEqualOriginal(invoice.concepts!, concepts)) {
    return undefined;
  }
  return concepts.map(mapFormConceptToPayload);
}

function stopCorrectionChanged(
  stop: TripStop,
  entry: TripCorrectionFormEntry,
): boolean {
  if (entry.address_id || entry.stop_address) {
    if (entry.address_id) {
      return entry.address_id !== (stop.addressId ?? "");
    }
    return entry.stop_address !== undefined;
  }

  if (!entry.rfc_remitente_destinatario) {
    return false;
  }

  const originalRfc = getEffectiveStopRfc(stop) ?? "";
  const originalNombre = getEffectiveStopNombre(stop);
  const nextNombre = entry.nombre_remitente_destinatario?.trim() ?? "";
  return (
    entry.rfc_remitente_destinatario !== originalRfc ||
    nextNombre !== originalNombre
  );
}

function tripFiscalCorrectionChanged(
  trip: Trip,
  entry: TripCorrectionFormEntry,
): boolean {
  const driverChanged =
    entry.driver_id !== undefined && entry.driver_id !== trip.driverId;
  const vehicleChanged =
    entry.vehicle_id !== undefined && entry.vehicle_id !== trip.vehicleId;
  return driverChanged || vehicleChanged;
}

export function buildSubstitutionTripCorrectionsDiff(
  stopsById: Map<string, TripStop>,
  tripsById: Map<string, Trip>,
  entries: TripCorrectionFormEntry[],
): TripCorrectionEntry[] | undefined {
  const changed: TripCorrectionEntry[] = [];

  for (const entry of entries) {
    if (entry.driver_id || entry.vehicle_id) {
      const trip = tripsById.get(entry.trip_id);
      if (!trip || !tripFiscalCorrectionChanged(trip, entry)) {
        continue;
      }
      changed.push({
        tripId: entry.trip_id,
        ...(entry.driver_id ? { driverId: entry.driver_id } : {}),
        ...(entry.vehicle_id ? { vehicleId: entry.vehicle_id } : {}),
        reason: entry.reason,
      });
      continue;
    }

    if (!entry.stop_id) {
      continue;
    }

    const stop = stopsById.get(entry.stop_id);
    if (!stop || !stopCorrectionChanged(stop, entry)) {
      continue;
    }

    if (entry.address_id) {
      changed.push({
        tripId: entry.trip_id,
        stopId: entry.stop_id,
        addressId: entry.address_id,
        reason: entry.reason,
      });
      continue;
    }

    if (entry.stop_address) {
      changed.push({
        tripId: entry.trip_id,
        stopId: entry.stop_id,
        stopAddress: entry.stop_address,
        reason: entry.reason,
      });
      continue;
    }

    if (!entry.rfc_remitente_destinatario) {
      continue;
    }

    changed.push({
      tripId: entry.trip_id,
      stopId: entry.stop_id,
      rfcRemitenteDestinatario: entry.rfc_remitente_destinatario,
      nombreRemitenteDestinatario: entry.nombre_remitente_destinatario,
      reason: entry.reason,
      propagateToClient: entry.propagate_to_client,
    });
  }

  return changed.length > 0 ? changed : undefined;
}

export function buildSubstitutionCorrectionsDiff(
  invoice: Invoice,
  values: SubstituteInvoiceSheetValues,
  stopsById: Map<string, TripStop> = new Map(),
  tripsById: Map<string, Trip> = new Map(),
  dirtyFields?: SubstitutionCorrectionsDirtyFields,
): SubstituteStampedInvoiceCorrections | undefined {
  const corrections: Partial<WritableSubstituteCorrections> = {};
  const conceptsDiff = buildSubstitutionConceptsDiff(invoice, values.concepts);
  // Conceptos son la fuente de verdad: si cambian, la API recalcula agregados
  // (ADR-0061 x ADR-0051 §6.1). Evitamos doble fuente de verdad omitiendo escalares.
  const includeAmountCorrections =
    !conceptsDiff && hasSubstitutionAmountDirtyFields(dirtyFields);

  if (conceptsDiff) {
    corrections.concepts = conceptsDiff;
  }

  for (const [camelKey, snakeKey] of FISCAL_FIELD_PAIRS) {
    const nextValue = values[snakeKey];
    const originalValue = invoice[camelKey];
    const original =
      originalValue === null || originalValue === undefined
        ? ""
        : String(originalValue);
    if (String(nextValue) !== original) {
      if (camelKey === "paymentMethod") {
        corrections.paymentMethod = nextValue as "PUE" | "PPD";
      } else if (camelKey === "receiverRfc") {
        corrections.receiverRfc = nextValue;
      } else if (camelKey === "receiverName") {
        corrections.receiverName = nextValue;
      } else if (camelKey === "receiverTaxRegime") {
        corrections.receiverTaxRegime = nextValue;
      } else if (camelKey === "receiverPostalCode") {
        corrections.receiverPostalCode = nextValue;
      } else if (camelKey === "cfdiUsage") {
        corrections.cfdiUsage = nextValue;
      } else if (camelKey === "paymentForm") {
        corrections.paymentForm = nextValue;
      }
    }
  }

  if (includeAmountCorrections) {
    const baseAmountDirty =
      Boolean(dirtyFields?.subtotal) || Boolean(dirtyFields?.discount);
    const derivedAmountDirty =
      Boolean(dirtyFields?.total_tax) ||
      Boolean(dirtyFields?.retained_tax) ||
      Boolean(dirtyFields?.total) ||
      Boolean(dirtyFields?.apply_retained_tax);

    if (baseAmountDirty && !derivedAmountDirty) {
      for (const [camelKey, snakeKey] of [
        ["subtotal", "subtotal"],
        ["discount", "discount"],
      ] as const) {
        const nextValue = Number(values[snakeKey] ?? 0);
        const originalValue = Number(invoice[camelKey] ?? 0);
        if (!numbersEqual(nextValue, originalValue)) {
          if (camelKey === "subtotal") {
            corrections.subtotal = nextValue;
          } else {
            corrections.discount = nextValue;
          }
        }
      }
    } else {
      for (const [camelKey, snakeKey] of AMOUNT_FIELD_PAIRS) {
        const nextValue = Number(values[snakeKey] ?? 0);
        const originalValue = Number(invoice[camelKey] ?? 0);
        if (!numbersEqual(nextValue, originalValue)) {
          if (camelKey === "subtotal") {
            corrections.subtotal = nextValue;
          } else if (camelKey === "discount") {
            corrections.discount = nextValue;
          } else if (camelKey === "totalTax") {
            corrections.totalTax = nextValue;
          } else if (camelKey === "retainedTax") {
            corrections.retainedTax = nextValue;
          } else if (camelKey === "total") {
            corrections.total = nextValue;
          }
        }
      }
    }
  }

  const tripCorrections = buildSubstitutionTripCorrectionsDiff(
    stopsById,
    tripsById,
    values.trip_corrections ?? [],
  );
  if (tripCorrections) {
    corrections.tripCorrections = tripCorrections;
  }

  const hasFiscalCorrections = FISCAL_FIELD_PAIRS.some(
    ([camelKey]) => corrections[camelKey] !== undefined,
  );
  if (values.propagate_receiver_to_client && hasFiscalCorrections) {
    corrections.propagateReceiverToClient = true;
  }

  return Object.keys(corrections).length > 0
    ? (corrections as SubstituteStampedInvoiceCorrections)
    : undefined;
}
