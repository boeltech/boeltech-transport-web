/**
 * Client Form Validation — consume @boeltech/cfdi-domain (ADR-0043).
 *
 * Reglas de paso 1 (tipo, razón social, RFC, régimen) y envelope comercial
 * viven en el paquete. Este archivo solo reexporta schema/tipos y mapeos UI.
 * Refinements UX locales (p. ej. contacto) no duplican reglas fiscales del paquete.
 */

import {
  clientPaymentTermsSchema,
  clientTypeSchema,
  createClientFormSchema,
  updateClientFormSchema,
} from "@boeltech/cfdi-domain/validadores/client";
import { z } from "zod";

import type { Client } from "../../domain";
import type { UpdateClientDTO } from "../../domain/repository";

export { clientTypeSchema, createClientFormSchema, updateClientFormSchema };
export const paymentTermsSchema = clientPaymentTermsSchema;

/**
 * Alta (wizard): mismo contrato del paquete + UX — si hay teléfono/correo/puesto
 * sin nombre de contacto, el contacto principal no se enviaría.
 */
export const clientFormSchema = createClientFormSchema.superRefine(
  (data, ctx) => {
    const hasContactDetail = Boolean(
      data.contactPosition?.trim() ||
        data.phone?.trim() ||
        data.secondaryPhone?.trim() ||
        data.email?.trim(),
    );
    if (hasContactDetail && !data.contactName?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["contactName"],
        message:
          "Indica el nombre del contacto si capturaste teléfono, correo o puesto.",
      });
    }
  },
);

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

/** Vacío de form → null (limpiar columna); valor truthy se conserva. */
function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Mapeo de formulario de edición → DTO de update.
 * `creditLimit` / strings clearables del form: vacío → `null` (sin límite / clear).
 * Contactos legacy (`contact_*`): omiten si vacíos (H2 fuera de alcance).
 */
export function clientFormDataToUpdateDto(data: ClientFormData): UpdateClientDTO {
  return {
    type: data.type,
    legalName: data.legalName,
    tradeName: emptyToNull(data.tradeName),
    taxId: data.taxId,
    taxRegime: data.taxRegime,
    contactName: data.contactName || undefined,
    contactPosition: data.contactPosition || undefined,
    phone: data.phone || undefined,
    secondaryPhone: data.secondaryPhone || undefined,
    email: data.email || undefined,
    billingEmail: emptyToNull(data.billingEmail),
    paymentTerms: data.paymentTerms,
    creditDays: data.creditDays,
    creditLimit: data.creditLimit ?? null,
    notes: emptyToNull(data.notes),
  };
}
