import { createInvoiceSchema } from "@boeltech/cfdi-domain/validadores/invoice";
import {
  tripCorrectionEntrySchema,
  type TripCorrectionEntry as TripCorrectionFormEntry,
} from "@boeltech/cfdi-domain/validadores/trip-stop-fiscal";
import type { TripStop } from "@features/trips/domain";
import {
  getEffectiveStopNombre,
  getEffectiveStopRfc,
} from "@features/trips/presentation/components/trip-fiscal/tripFiscalHelpers";
import { z } from "zod";
import type {
  Invoice,
  SubstituteStampedInvoiceCorrections,
  TripCorrectionEntry,
} from "@features/invoicing/domain";

export const RETAINED_TAX_RATE = 0.04;

const retainedTaxUx = z.object({
  apply_retained_tax: z.boolean(),
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
  trip_corrections: TripCorrectionFormEntry[];
};

const tripCorrectionFormEntrySchema =
  tripCorrectionEntrySchema as unknown as z.ZodType<TripCorrectionFormEntry>;

const substituteInvoiceSheetUxSchema = z.object({
  cancellationReason: z
    .string()
    .min(1, "Describe el motivo (se envía al SAT como parte de la cancelación 01)")
    .max(500),
  notes: z.string().max(500).optional(),
  trip_corrections: z.array(tripCorrectionFormEntrySchema).default([]),
});

export const substituteInvoiceSheetSchema = (
  substitutionCorrectionFormFieldsSchema as unknown as z.ZodObject<z.ZodRawShape>
).merge(substituteInvoiceSheetUxSchema) as unknown as z.ZodType<SubstituteInvoiceSheetValues>;

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

export function defaultSubstituteInvoiceSheetValues(
  invoice: Invoice,
): SubstituteInvoiceSheetValues {
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
    apply_retained_tax: (invoice.retainedTax ?? 0) > 0,
    trip_corrections: [],
  };
}

function stopCorrectionChanged(
  stop: TripStop,
  entry: TripCorrectionFormEntry,
): boolean {
  const originalRfc = getEffectiveStopRfc(stop) ?? "";
  const originalNombre = getEffectiveStopNombre(stop);
  const nextNombre = entry.nombre_remitente_destinatario?.trim() ?? "";
  return (
    entry.rfc_remitente_destinatario !== originalRfc ||
    nextNombre !== originalNombre
  );
}

export function buildSubstitutionTripCorrectionsDiff(
  stopsById: Map<string, TripStop>,
  entries: TripCorrectionFormEntry[],
): TripCorrectionEntry[] | undefined {
  const changed: TripCorrectionEntry[] = [];

  for (const entry of entries) {
    const stop = stopsById.get(entry.stop_id);
    if (!stop || !stopCorrectionChanged(stop, entry)) {
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
  dirtyFields?: SubstitutionCorrectionsDirtyFields,
): SubstituteStampedInvoiceCorrections | undefined {
  const corrections: Partial<WritableSubstituteCorrections> = {};
  const includeAmountCorrections = hasSubstitutionAmountDirtyFields(dirtyFields);

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

  const tripCorrections = buildSubstitutionTripCorrectionsDiff(
    stopsById,
    values.trip_corrections ?? [],
  );
  if (tripCorrections) {
    corrections.tripCorrections = tripCorrections;
  }

  return Object.keys(corrections).length > 0
    ? (corrections as SubstituteStampedInvoiceCorrections)
    : undefined;
}
