/**
 * Secciones del form de edición de sucursal (D8) + conteo de errores por rail.
 * Orden canónico: General · Contacto · Ubicación.
 */

import type { FieldErrors } from "react-hook-form";
import type { LucideIcon } from "lucide-react";
import { Building2, MapPin, Phone } from "lucide-react";
import type { LongFormSectionItem } from "@shared/ui/form";
import type { BranchFormData } from "../validation/branchSchema";
import { branchesCopy } from "../copy/branchesCopy";

const fc = branchesCopy.form;

export const BRANCH_EDIT_SECTION_IDS = {
  general: "branch-edit-general",
  contact: "branch-edit-contact",
  location: "branch-edit-location",
} as const;

export type BranchEditSectionKey = keyof typeof BRANCH_EDIT_SECTION_IDS;

export const BRANCH_EDIT_SECTION_ORDER: BranchEditSectionKey[] = [
  "general",
  "contact",
  "location",
];

const SECTION_ICONS: Record<BranchEditSectionKey, LucideIcon> = {
  general: Building2,
  contact: Phone,
  location: MapPin,
};

export const BRANCH_EDIT_SECTIONS: LongFormSectionItem[] =
  BRANCH_EDIT_SECTION_ORDER.map((key) => ({
    id: BRANCH_EDIT_SECTION_IDS[key],
    label: fc.section[key].nav,
    icon: SECTION_ICONS[key],
  }));

export const BRANCH_EDIT_SECTION_FIELDS: Record<
  Exclude<BranchEditSectionKey, "location">,
  (keyof BranchFormData)[]
> = {
  general: ["code", "name", "status", "isMain"],
  contact: ["phone", "email", "managerName"],
};

/** Campos anidados de `address` que cuentan para el badge de Ubicación. */
export const BRANCH_EDIT_ADDRESS_ERROR_KEYS = [
  "locationName",
  "street",
  "exteriorNumber",
  "interiorNumber",
  "reference",
  "postalCode",
  "satCountryCode",
  "satStateCode",
  "satMunicipalityCode",
  "satLocalityCode",
  "localityName",
  "satNeighborhoodCode",
  "neighborhoodName",
  "latitude",
  "longitude",
] as const satisfies readonly (keyof BranchFormData["address"])[];

function countAddressFieldErrors(
  addressErrors: FieldErrors<BranchFormData>["address"],
): number {
  if (!addressErrors) return 0;
  let n = 0;
  for (const key of BRANCH_EDIT_ADDRESS_ERROR_KEYS) {
    if (addressErrors[key]) n += 1;
  }
  return n;
}

export function countBranchEditSectionErrors(
  errors: FieldErrors<BranchFormData>,
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const key of BRANCH_EDIT_SECTION_ORDER) {
    const sectionId = BRANCH_EDIT_SECTION_IDS[key];
    if (key === "location") {
      let n = 0;
      if (errors.notes) n += 1;
      n += countAddressFieldErrors(errors.address);
      counts[sectionId] = n;
      continue;
    }
    let n = 0;
    for (const field of BRANCH_EDIT_SECTION_FIELDS[key]) {
      if (errors[field]) n += 1;
    }
    counts[sectionId] = n;
  }

  return counts;
}
