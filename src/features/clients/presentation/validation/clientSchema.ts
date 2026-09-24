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

const billingSchemeIdSchema = z
  .string()
  .uuid({ message: "Esquema de facturación inválido" })
  .optional()
  .nullable();

export { clientTypeSchema, createClientFormSchema, updateClientFormSchema };
export const paymentTermsSchema = clientPaymentTermsSchema;

/** Edición: contrato del paquete + esquema + autoenvío (ADR-0082 / ADR-0083). */
export const clientEditFormSchema = updateClientFormSchema.extend({
  billingSchemeId: billingSchemeIdSchema,
  invoiceAutoDispatchEnabled: z.boolean().default(false),
});

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

export type ClientFormData = z.infer<typeof createClientFormSchema> & {
  billingSchemeId?: string | null;
  invoiceAutoDispatchEnabled?: boolean;
};
export type UpdateClientFormData = z.infer<typeof clientEditFormSchema>;

export const defaultClientFormValues: ClientFormData = {
  type: "company",
  legalName: "",
  tradeName: "",
  cfdiReceptorProfile: "receptor_cfdi",
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
  invoiceAutoDispatchEnabled: false,
};

export function clientToFormValues(client: Client): ClientFormData {
  return {
    type: client.type,
    legalName: client.legalName,
    tradeName: client.tradeName ?? "",
    cfdiReceptorProfile: client.cfdiReceptorProfile ?? "receptor_cfdi",
    taxId: (client.taxId ?? "").trim().toUpperCase(),
    taxRegime: client.taxRegime ?? "",
    contactName: client.contactName ?? "",
    contactPosition: client.contactPosition ?? "",
    phone: client.phone ?? "",
    secondaryPhone: client.secondaryPhone ?? "",
    email: client.email ?? "",
    billingEmail: client.billingEmail ?? "",
    billingSchemeId: client.billingSchemeId ?? undefined,
    invoiceAutoDispatchEnabled: Boolean(client.invoiceAutoDispatchEnabled),
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
 * Contactos legacy (`contact_*` / phone / email) no se envían (WS-B → client_contacts).
 */
export function clientFormDataToUpdateDto(data: ClientFormData): UpdateClientDTO {
  const profile = data.cfdiReceptorProfile ?? "receptor_cfdi";
  const taxIdTrimmed = data.taxId?.trim() ?? "";
  const taxRegimeTrimmed = data.taxRegime?.trim() ?? "";

  return {
    type: data.type,
    legalName: data.legalName,
    tradeName: emptyToNull(data.tradeName),
    cfdiReceptorProfile: profile,
    taxId: taxIdTrimmed.length > 0 ? taxIdTrimmed.toUpperCase() : null,
    taxRegime: taxRegimeTrimmed.length > 0 ? taxRegimeTrimmed : null,
    billingEmail: emptyToNull(data.billingEmail),
    billingSchemeId:
      profile === "comercial_only"
        ? null
        : data.billingSchemeId?.trim()
          ? data.billingSchemeId
          : null,
    invoiceAutoDispatchEnabled:
      profile === "comercial_only"
        ? false
        : Boolean(data.invoiceAutoDispatchEnabled),
    paymentTerms: data.paymentTerms,
    creditDays: data.creditDays,
    creditLimit: data.creditLimit ?? null,
    notes: emptyToNull(data.notes),
  };
}
