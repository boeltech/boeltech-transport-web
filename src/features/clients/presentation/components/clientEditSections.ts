/**
 * Secciones del form de edición de cliente (D8) + conteo de errores por rail.
 * Alineado a la estructura real de ClientForm en mode="edit"
 * (Tipo · Fiscal · Envío · Comercial · Notas). Contacto solo en create.
 */

import type { FieldErrors } from "react-hook-form";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CreditCard,
  FileText,
  Landmark,
  Mail,
} from "lucide-react";
import type { LongFormSectionItem } from "@shared/ui/form";
import type { ClientFormData } from "../validation/clientSchema";
import { clientsCopy } from "../copy/clientsCopy";

const fc = clientsCopy.form;

export const CLIENT_EDIT_SECTION_IDS = {
  type: "client-edit-type",
  fiscal: "client-edit-fiscal",
  dispatch: "client-edit-dispatch",
  commercial: "client-edit-commercial",
  notes: "client-edit-notes",
} as const;

export type ClientEditSectionKey = keyof typeof CLIENT_EDIT_SECTION_IDS;

/** Orden canónico; Envío se omite del rail cuando el perfil es Solo comercial. */
export const CLIENT_EDIT_SECTION_ORDER: ClientEditSectionKey[] = [
  "type",
  "fiscal",
  "dispatch",
  "commercial",
  "notes",
];

const SECTION_ICONS: Record<ClientEditSectionKey, LucideIcon> = {
  type: Building2,
  fiscal: Landmark,
  dispatch: Mail,
  commercial: CreditCard,
  notes: FileText,
};

export const CLIENT_EDIT_SECTION_FIELDS: Record<
  ClientEditSectionKey,
  (keyof ClientFormData)[]
> = {
  type: ["type"],
  fiscal: [
    "cfdiReceptorProfile",
    "legalName",
    "tradeName",
    "taxId",
    "taxRegime",
    "billingEmail",
  ],
  dispatch: ["billingSchemeId", "invoiceAutoDispatchEnabled"],
  commercial: ["paymentTerms", "creditDays", "creditLimit"],
  notes: ["notes"],
};

export function getClientEditSections(
  includeDispatch: boolean,
): LongFormSectionItem[] {
  return CLIENT_EDIT_SECTION_ORDER.filter(
    (key) => includeDispatch || key !== "dispatch",
  ).map((key) => ({
    id: CLIENT_EDIT_SECTION_IDS[key],
    label: fc.section[key].nav,
    icon: SECTION_ICONS[key],
  }));
}

/** Rail completo (con Envío) — útil en tests y demos. */
export const CLIENT_EDIT_SECTIONS: LongFormSectionItem[] =
  getClientEditSections(true);

export function countClientEditSectionErrors(
  errors: FieldErrors<ClientFormData>,
  includeDispatch = true,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const key of CLIENT_EDIT_SECTION_ORDER) {
    if (!includeDispatch && key === "dispatch") continue;
    const sectionId = CLIENT_EDIT_SECTION_IDS[key];
    let n = 0;
    for (const field of CLIENT_EDIT_SECTION_FIELDS[key]) {
      if (errors[field]) n += 1;
    }
    counts[sectionId] = n;
  }
  return counts;
}
