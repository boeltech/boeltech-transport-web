import { createInvoiceSchema } from "@boeltech/cfdi-domain/validadores/invoice";
import { z } from "zod";

/** Campo UX-only: deriva `retained_tax` en el payload API. */
const retainedTaxUx = z.object({
  apply_retained_tax: z.boolean(),
});

/** Schema compartido create/edit en RHF (`trip_ids` opcional; obligatorio al crear vía URL). */
export const invoiceFormSchema = createInvoiceSchema
  .omit({ trip_ids: true })
  .extend(retainedTaxUx.shape)
  .extend({
    trip_ids: z.array(z.string().uuid()).optional(),
  });

/** Alta — validación estricta con viaje (tests y parse de envío). */
export const invoiceCreateFormSchema = createInvoiceSchema.extend(
  retainedTaxUx.shape,
);

/** Edición de borrador (sin `trip_ids`). */
export const invoiceDraftFormSchema = createInvoiceSchema
  .omit({ trip_ids: true })
  .extend(retainedTaxUx.shape);

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type InvoiceCreateFormValues = z.infer<typeof invoiceCreateFormSchema>;
export type InvoiceDraftFormValues = z.infer<typeof invoiceDraftFormSchema>;

export const RETAINED_TAX_RATE = 0.04;

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
  };
}

export function parseCreateInvoicePayload(
  values: InvoiceFormValues,
  tripId: string,
) {
  const { apply_retained_tax: _apply, ...rest } = values;
  return createInvoiceSchema.parse({
    ...rest,
    trip_ids: tripId ? [tripId] : values.trip_ids ?? [],
  });
}

export function parseDraftInvoicePayload(values: InvoiceFormValues) {
  const { apply_retained_tax: _apply, trip_ids: _tripIds, ...rest } = values;
  return invoiceDraftFormSchema.parse(rest);
}
