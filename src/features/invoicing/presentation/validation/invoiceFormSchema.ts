import { createInvoiceSchema } from "@boeltech/cfdi-domain/validadores/invoice";
import {
  PERSONA_MORAL_RETAINED_IVA_RATE,
} from "@boeltech/cfdi-domain";
import type { InvoiceConcept } from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";
import { z } from "zod";

const conceptLineValidation =
  invoicingCopy.concepts.sheet.validation;

/** Campo UX-only: deriva `retained_tax` en el payload API. */
const retainedTaxUx = z.object({
  apply_retained_tax: z.boolean(),
  /** Persona moral: retención 4% obligatoria sobre el flete (OP-L0.3). */
  retention_required: z.boolean().optional().default(false),
});

export const RETAINED_TAX_RATE = PERSONA_MORAL_RETAINED_IVA_RATE;

export const invoiceConceptFormSchema = z.object({
  concept_type: z.enum(["flete", "service"]),
  service_concept_id: z.string().uuid().optional(),
  clave_prod_serv: z
    .string()
    .min(1, conceptLineValidation.claveProdServRequired),
  clave_unidad: z.string().min(1, conceptLineValidation.claveUnidadRequired),
  unidad: z.string().min(1, conceptLineValidation.unidadRequired),
  description: z.string().min(1, conceptLineValidation.descriptionRequired),
  quantity: z.number().positive(conceptLineValidation.quantityPositive),
  unit_price: z.number().min(0, conceptLineValidation.unitPriceMin),
  amount: z.number().min(0),
  object_imp: z.enum(["01", "02", "03", "04"]),
  iva_rate: z.number().min(0).max(1).optional(),
  retained_iva_rate: z.number().min(0).max(1).optional(),
});

/** Validación al aplicar partida en sheet (precio unitario > 0). */
export const invoiceConceptSheetSchema = invoiceConceptFormSchema.superRefine(
  (line, ctx) => {
    if (line.unit_price <= 0) {
      ctx.addIssue({
        code: "custom",
        message: conceptLineValidation.unitPriceRequired,
        path: ["unit_price"],
      });
    }
  },
);

export type InvoiceConceptFormLine = z.infer<typeof invoiceConceptFormSchema>;

export function refinePersonaMoralRetention(
  values: {
    retention_required?: boolean;
    concepts: InvoiceConceptFormLine[];
    retained_tax: number;
  },
  ctx: {
    addIssue: (issue: {
      code: "custom";
      message: string;
      path: (string | number)[];
    }) => void;
  },
): void {
  if (!values.retention_required) {
    return;
  }

  const fleteGravadaLines = values.concepts.filter(
    (line) =>
      line.concept_type === "flete" &&
      line.object_imp === "02" &&
      line.amount > 0,
  );

  if (fleteGravadaLines.length === 0) {
    return;
  }

  const minFleteRetention =
    Math.round(
      fleteGravadaLines.reduce(
        (sum, line) => sum + line.amount * PERSONA_MORAL_RETAINED_IVA_RATE,
        0,
      ) * 100,
    ) / 100;

  if ((values.retained_tax ?? 0) + 0.01 < minFleteRetention) {
    ctx.addIssue({
      code: "custom",
      message:
        "La retención IVA del 4% es obligatoria sobre el flete para receptores persona moral",
      path: ["retained_tax"],
    });
  }

  values.concepts.forEach((line, index) => {
    if (
      line.concept_type !== "flete" ||
      line.object_imp !== "02" ||
      line.amount <= 0
    ) {
      return;
    }
    const rate = line.retained_iva_rate ?? 0;
    if (rate !== PERSONA_MORAL_RETAINED_IVA_RATE) {
      ctx.addIssue({
        code: "custom",
        message: "El flete gravado debe incluir retención IVA del 4%",
        path: ["concepts", index, "retained_iva_rate"],
      });
    }
  });
}

const invoiceFormBase = createInvoiceSchema
  .omit({ trip_ids: true, concepts: true })
  .extend(retainedTaxUx.shape)
  .extend({
    trip_ids: z.array(z.string().uuid()).optional(),
    concepts: z.array(invoiceConceptFormSchema).min(1),
  });

/** Schema compartido create/edit en RHF (`trip_ids` opcional; obligatorio al crear vía URL). */
export const invoiceFormSchema = invoiceFormBase.superRefine((values, ctx) => {
  refinePersonaMoralRetention(values, ctx);
});

/**
 * Campos que se editan en el sheet «Corregir datos fiscales».
 * Derivado del mismo schema base: no duplica reglas del paquete (RFC, CP, etc.).
 */
export const invoiceReceiverFormSchema = invoiceFormBase.pick({
  receiver_rfc: true,
  receiver_name: true,
  receiver_tax_regime: true,
  receiver_postal_code: true,
  cfdi_usage: true,
  payment_form: true,
  payment_method: true,
});

export type InvoiceReceiverFormValues = z.infer<typeof invoiceReceiverFormSchema>;

/** Orden de lectura del sheet fiscal; se usa para decidir si un error vive ahí. */
export const INVOICE_RECEIVER_FIELD_NAMES = [
  "receiver_name",
  "receiver_rfc",
  "receiver_tax_regime",
  "receiver_postal_code",
  "cfdi_usage",
  "payment_form",
  "payment_method",
] as const satisfies ReadonlyArray<keyof InvoiceReceiverFormValues>;

/** Alta — validación estricta con viaje (tests y parse de envío). */
export const invoiceCreateFormSchema = createInvoiceSchema
  .omit({ concepts: true })
  .extend(retainedTaxUx.shape)
  .extend({
    concepts: z.array(invoiceConceptFormSchema).min(1),
  })
  .superRefine((values, ctx) => {
    refinePersonaMoralRetention(values, ctx);
  });

/** Edición de borrador (sin `trip_ids`). */
export const invoiceDraftFormSchema = createInvoiceSchema
  .omit({ trip_ids: true, concepts: true })
  .extend(retainedTaxUx.shape)
  .extend({
    concepts: z.array(invoiceConceptFormSchema).min(1),
  })
  .superRefine((values, ctx) => {
    refinePersonaMoralRetention(values, ctx);
  });

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type InvoiceCreateFormValues = z.infer<typeof invoiceCreateFormSchema>;
export type InvoiceDraftFormValues = z.infer<typeof invoiceDraftFormSchema>;

export function inferRetentionRequired(options: {
  clientType?: string | null;
  retainedTax?: number;
  receiverRfc?: string;
  concepts?: Array<{ retained_iva_rate?: number; retainedIvaRate?: number }>;
}): boolean {
  if (options.clientType === "company") {
    return true;
  }

  const hasRetainedOnInvoice =
    (options.retainedTax ?? 0) > 0 ||
    options.concepts?.some(
      (line) => (line.retained_iva_rate ?? line.retainedIvaRate ?? 0) > 0,
    ) === true;

  if (options.clientType === "individual") {
    return hasRetainedOnInvoice;
  }

  if (hasRetainedOnInvoice) {
    return true;
  }

  // Sin tipo de cliente (factura manual): heurística RFC 12 = persona moral.
  if (options.receiverRfc?.trim().length === 12) {
    return true;
  }
  return false;
}

export function applyConceptTaxFlags(
  ivaAplica: boolean,
  retencionAplica: boolean,
  taxRate: number,
): Pick<InvoiceConceptFormLine, "iva_rate" | "retained_iva_rate" | "object_imp"> {
  return {
    object_imp: "02",
    iva_rate: ivaAplica ? taxRate : 0,
    retained_iva_rate: retencionAplica ? RETAINED_TAX_RATE : 0,
  };
}

export function readConceptTaxFlags(line: {
  iva_rate?: number;
  retained_iva_rate?: number;
}): { ivaAplica: boolean; retencionAplica: boolean } {
  return {
    ivaAplica: (line.iva_rate ?? 0) > 0,
    retencionAplica: (line.retained_iva_rate ?? 0) > 0,
  };
}

export function defaultFleteConceptFormLine(
  subtotal = 0,
  options?: {
    taxRate?: number;
    ivaAplica?: boolean;
    retencionAplica?: boolean;
  },
): InvoiceConceptFormLine {
  const taxRate = options?.taxRate ?? 0.16;
  return {
    concept_type: "flete",
    clave_prod_serv: "78101800",
    clave_unidad: "E48",
    unidad: "Servicio",
    description: "Servicio de transporte de carga",
    quantity: 1,
    unit_price: subtotal,
    amount: subtotal,
    ...applyConceptTaxFlags(
      options?.ivaAplica ?? true,
      options?.retencionAplica ?? false,
      taxRate,
    ),
  };
}

export function defaultInvoiceFormValues(): InvoiceFormValues {
  return {
    receiver_rfc: "",
    receiver_name: "",
    cfdi_usage: "S01",
    receiver_tax_regime: "",
    receiver_postal_code: "",
    payment_form: "99",
    payment_method: "PUE",
    currency: "MXN",
    subtotal: 0,
    discount: 0,
    total_tax: 0,
    retained_tax: 0,
    total: 0,
    notes: "",
    apply_retained_tax: false,
    retention_required: false,
    billing_scope: "primary_transport",
    trip_ids: [],
    concepts: [defaultFleteConceptFormLine(0)],
  };
}

export function mapInvoiceConceptToFormInput(
  concept: InvoiceConcept,
): InvoiceConceptFormLine {
  return {
    concept_type: concept.conceptType,
    service_concept_id: concept.serviceConceptId,
    clave_prod_serv: concept.claveProdServ,
    clave_unidad: concept.claveUnidad,
    unidad: concept.unidad,
    description: concept.description,
    quantity: concept.quantity,
    unit_price: concept.unitPrice,
    amount: concept.amount,
    object_imp: concept.objectImp,
    iva_rate: concept.ivaRate,
    retained_iva_rate: concept.retainedIvaRate,
  };
}

export function mapFormConceptToPayload(
  concept: InvoiceConceptFormLine,
): InvoiceConcept {
  return {
    conceptType: concept.concept_type,
    serviceConceptId: concept.service_concept_id,
    claveProdServ: concept.clave_prod_serv,
    claveUnidad: concept.clave_unidad,
    unidad: concept.unidad,
    description: concept.description,
    quantity: concept.quantity,
    unitPrice: concept.unit_price,
    amount: concept.amount,
    objectImp: concept.object_imp,
    ivaRate: concept.iva_rate,
    retainedIvaRate: concept.retained_iva_rate,
  };
}

export function parseCreateInvoicePayload(
  values: InvoiceFormValues,
  tripId: string,
  billingScope: "primary_transport" | "accessory" = "primary_transport",
) {
  const { apply_retained_tax: _apply, retention_required: _retention, ...rest } = values;
  void _apply;
  void _retention;
  return createInvoiceSchema.parse({
    ...rest,
    trip_ids: tripId ? [tripId] : values.trip_ids ?? [],
    billing_scope: billingScope,
  });
}

export function parseDraftInvoicePayload(values: InvoiceFormValues) {
  const parsed = invoiceDraftFormSchema.parse(values);
  const { apply_retained_tax: _apply, retention_required: _retention, ...rest } = parsed;
  void _apply;
  void _retention;
  return rest;
}
