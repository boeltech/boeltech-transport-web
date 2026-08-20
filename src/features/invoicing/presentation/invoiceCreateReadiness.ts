import type { InvoiceFormValues } from "./validation/invoiceFormSchema";

export type InvoiceCreateReadiness = {
  receiverOk: boolean;
  conceptsOk: boolean;
  totalOk: boolean;
  allOk: boolean;
};

/** Checklist de producto (Capa 1 D5): Receptor · Conceptos · Total. */
export function getInvoiceCreateReadiness(
  values: Pick<
    InvoiceFormValues,
    | "receiver_name"
    | "receiver_rfc"
    | "receiver_tax_regime"
    | "receiver_postal_code"
    | "cfdi_usage"
    | "payment_form"
    | "payment_method"
    | "concepts"
    | "total"
  >,
): InvoiceCreateReadiness {
  const receiverOk = Boolean(
    values.receiver_name?.trim() &&
      values.receiver_rfc?.trim() &&
      values.receiver_tax_regime?.trim() &&
      values.receiver_postal_code?.trim() &&
      values.cfdi_usage?.trim() &&
      values.payment_form?.trim() &&
      values.payment_method,
  );
  const conceptsOk = (values.concepts?.length ?? 0) > 0;
  const totalOk = (values.total ?? 0) > 0;

  return {
    receiverOk,
    conceptsOk,
    totalOk,
    allOk: receiverOk && conceptsOk && totalOk,
  };
}
