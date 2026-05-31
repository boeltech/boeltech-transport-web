/**
 * Client Form Validation — consume @boeltech/cfdi-domain (ADR-0043).
 *
 * Reglas de paso 1 (tipo, razón social, RFC, régimen) y envelope comercial
 * viven en el paquete. Este archivo solo reexporta schema/tipos y mapeos UI.
 */

import {
  clientPaymentTermsSchema,
  clientTypeSchema,
  createClientFormSchema,
  updateClientFormSchema,
} from "@boeltech/cfdi-domain/validadores/client";
import type { z } from "zod";

import type { Client } from "../../domain";
import type { UpdateClientDTO } from "../../domain/repository";

export { clientTypeSchema, createClientFormSchema, updateClientFormSchema };
export const paymentTermsSchema = clientPaymentTermsSchema;
export const clientFormSchema = createClientFormSchema;

export type ClientFormData = z.infer<typeof createClientFormSchema>;
export type UpdateClientFormData = z.infer<typeof updateClientFormSchema>;

export const defaultClientFormValues: ClientFormData = {
  type: "company",
  legalName: "",
  tradeName: "",
  taxId: "",
  taxRegime: "",
  contactName: "",
  contactPosition: "",
  phone: "",
  secondaryPhone: "",
  email: "",
  billingEmail: "",
  paymentTerms: "cash",
  creditDays: 0,
  creditLimit: undefined,
  notes: "",
};

export function clientToFormValues(client: Client): ClientFormData {
  return {
    type: client.type,
    legalName: client.legalName,
    tradeName: client.tradeName ?? "",
    taxId: client.taxId.trim().toUpperCase(),
    taxRegime: client.taxRegime ?? "",
    contactName: client.contactName ?? "",
    contactPosition: client.contactPosition ?? "",
    phone: client.phone ?? "",
    secondaryPhone: client.secondaryPhone ?? "",
    email: client.email ?? "",
    billingEmail: client.billingEmail ?? "",
    paymentTerms: client.paymentTerms,
    creditDays: client.creditDays,
    creditLimit: client.creditLimit ?? undefined,
    notes: client.notes ?? "",
  };
}

export function clientFormDataToUpdateDto(data: ClientFormData): UpdateClientDTO {
  return {
    type: data.type,
    legalName: data.legalName,
    tradeName: data.tradeName || undefined,
    taxId: data.taxId,
    taxRegime: data.taxRegime,
    contactName: data.contactName || undefined,
    contactPosition: data.contactPosition || undefined,
    phone: data.phone || undefined,
    secondaryPhone: data.secondaryPhone || undefined,
    email: data.email || undefined,
    billingEmail: data.billingEmail || undefined,
    paymentTerms: data.paymentTerms,
    creditDays: data.creditDays,
    creditLimit: data.creditLimit,
    notes: data.notes || undefined,
  };
}
