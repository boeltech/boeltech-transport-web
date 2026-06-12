/**
 * Client Contact Form Schema (WS-B)
 */

import { z } from "zod";
import type {
  ClientContact,
  CreateClientContactDTO,
  UpdateClientContactDTO,
} from "../../domain";

export const clientContactFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(160, "Máximo 160 caracteres"),
  position: z.string().trim().max(120, "Máximo 120 caracteres").optional(),
  email: z
    .string()
    .trim()
    .email("Correo electrónico inválido")
    .max(160, "Máximo 160 caracteres")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(40, "Máximo 40 caracteres").optional(),
  secondaryPhone: z.string().trim().max(40, "Máximo 40 caracteres").optional(),
  signsCartaPorte: z.boolean().default(false),
  receivesInvoices: z.boolean().default(false),
  authorizesPayments: z.boolean().default(false),
  isPrimary: z.boolean().default(false),
  notes: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
});

export type ClientContactFormData = z.infer<typeof clientContactFormSchema>;

export const defaultClientContactFormValues: ClientContactFormData = {
  fullName: "",
  position: "",
  email: "",
  phone: "",
  secondaryPhone: "",
  signsCartaPorte: false,
  receivesInvoices: false,
  authorizesPayments: false,
  isPrimary: false,
  notes: "",
};

export function clientContactToFormValues(
  contact: ClientContact,
): ClientContactFormData {
  return {
    fullName: contact.fullName,
    position: contact.position ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    secondaryPhone: contact.secondaryPhone ?? "",
    signsCartaPorte: contact.signsCartaPorte,
    receivesInvoices: contact.receivesInvoices,
    authorizesPayments: contact.authorizesPayments,
    isPrimary: contact.isPrimary,
    notes: contact.notes ?? "",
  };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function clientContactFormDataToCreateDto(
  data: ClientContactFormData,
): CreateClientContactDTO {
  return {
    fullName: data.fullName.trim(),
    position: emptyToUndefined(data.position) ?? null,
    email: emptyToUndefined(data.email) ?? null,
    phone: emptyToUndefined(data.phone) ?? null,
    secondaryPhone: emptyToUndefined(data.secondaryPhone) ?? null,
    signsCartaPorte: data.signsCartaPorte,
    receivesInvoices: data.receivesInvoices,
    authorizesPayments: data.authorizesPayments,
    isPrimary: data.isPrimary,
    notes: emptyToUndefined(data.notes) ?? null,
  };
}

export function clientContactFormDataToUpdateDto(
  data: ClientContactFormData,
): UpdateClientContactDTO {
  return clientContactFormDataToCreateDto(data);
}
