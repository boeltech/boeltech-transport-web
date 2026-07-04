import { createInvoiceSchema } from "@boeltech/cfdi-domain/validadores/invoice";
import type { InvoiceConcept } from "@features/invoicing/domain";
import { z } from "zod";

/** Campo UX-only: deriva `retained_tax` en el payload API. */
const retainedTaxUx = z.object({
  apply_retained_tax: z.boolean(),
});

export const invoiceConceptFormSchema = z.object({
  concept_type: z.enum(["flete", "service"]),
  service_concept_id: z.string().uuid().optional(),
  clave_prod_serv: z.string().min(1),
  clave_unidad: z.string().min(1),
  unidad: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  amount: z.number().min(0),
  object_imp: z.enum(["01", "02", "03", "04"]),
  iva_rate: z.number().min(0).max(1).optional(),
  retained_iva_rate: z.number().min(0).max(1).optional(),
});

export type InvoiceConceptFormLine = z.infer<typeof invoiceConceptFormSchema>;

/** Schema compartido create/edit en RHF (`trip_ids` opcional; obligatorio al crear vía URL). */
export const invoiceFormSchema = createInvoiceSchema
  .omit({ trip_ids: true, concepts: true })
  .extend(retainedTaxUx.shape)
  .extend({
    trip_ids: z.array(z.string().uuid()).optional(),
    concepts: z.array(invoiceConceptFormSchema).min(1),
  });

/** Alta — validación estricta con viaje (tests y parse de envío). */
export const invoiceCreateFormSchema = createInvoiceSchema
  .omit({ concepts: true })
  .extend(retainedTaxUx.shape)
  .extend({
    concepts: z.array(invoiceConceptFormSchema).min(1),
  });

/** Edición de borrador (sin `trip_ids`). */
export const invoiceDraftFormSchema = createInvoiceSchema
  .omit({ trip_ids: true, concepts: true })
  .extend(retainedTaxUx.shape)
  .extend({
    concepts: z.array(invoiceConceptFormSchema).min(1),
  });

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type InvoiceCreateFormValues = z.infer<typeof invoiceCreateFormSchema>;
export type InvoiceDraftFormValues = z.infer<typeof invoiceDraftFormSchema>;

export const RETAINED_TAX_RATE = 0.04;

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
) {
  const { apply_retained_tax: _apply, ...rest } = values;
  void _apply;
  return createInvoiceSchema.parse({
    ...rest,
    trip_ids: tripId ? [tripId] : values.trip_ids ?? [],
  });
}

export function parseDraftInvoicePayload(values: InvoiceFormValues) {
  const parsed = invoiceDraftFormSchema.parse(values);
  const { apply_retained_tax: _apply, ...rest } = parsed;
  void _apply;
  return rest;
}
