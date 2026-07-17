import { z } from "zod";
import { BranchStatus, type CreateBranchDTO, type UpdateBranchDTO } from "../../domain";
import {
  branchOperationalAddressFormSchema,
  defaultBranchOperationalAddressValues,
  normalizeBranchOperationalAddressFormData,
  type BranchOperationalAddressFormData,
} from "./branchOperationalAddressSchema";

export const branchFormSchema = z.object({
  code: z
    .string()
    .min(2, "El código es requerido")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[A-Za-z0-9-]+$/, "Usa solo letras, números y guiones"),
  name: z
    .string()
    .min(2, "El nombre es requerido")
    .max(120, "Máximo 120 caracteres"),
  status: z.enum([BranchStatus.ACTIVE, BranchStatus.INACTIVE]),
  isMain: z.boolean().default(false),
  address: branchOperationalAddressFormSchema,
  phone: z
    .string()
    .max(25, "Máximo 25 caracteres")
    .regex(/^[0-9+()\-\s]+$/, "Teléfono inválido")
    .optional()
    .or(z.literal("")),
  email: z.email("Correo inválido").optional().or(z.literal("")),
  managerName: z.string().max(120, "Máximo 120 caracteres").optional().or(z.literal("")),
  notes: z.string().max(1000, "Máximo 1000 caracteres").optional().or(z.literal("")),
});

export type BranchFormData = z.infer<typeof branchFormSchema>;

export const defaultBranchFormValues: BranchFormData = {
  code: "",
  name: "",
  status: BranchStatus.ACTIVE,
  isMain: false,
  address: defaultBranchOperationalAddressValues,
  phone: "",
  email: "",
  managerName: "",
  notes: "",
};

function trimOrUndefined(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function trimOrNull(value?: string): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function emptyToNull(value?: string | null): string | null {
  if (value == null) return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function addressToApiPayload(
  address: BranchOperationalAddressFormData,
  locationName: string,
) {
  const normalized = normalizeBranchOperationalAddressFormData(address);
  return {
    street: normalized.street,
    exterior_number: trimOrUndefined(normalized.exteriorNumber),
    interior_number: trimOrUndefined(normalized.interiorNumber ?? undefined),
    neighborhood_name: trimOrUndefined(normalized.neighborhoodName ?? undefined),
    postal_code: normalized.postalCode,
    sat_country_code: normalized.satCountryCode,
    sat_state_code: normalized.satStateCode,
    sat_municipality_code: emptyToNull(normalized.satMunicipalityCode),
    sat_locality_code: emptyToNull(normalized.satLocalityCode),
    locality_name: emptyToNull(normalized.localityName),
    sat_neighborhood_code: emptyToNull(normalized.satNeighborhoodCode),
    latitude: normalized.latitude ?? null,
    longitude: normalized.longitude ?? null,
    location_name: locationName.trim(),
    reference: emptyToNull(normalized.reference),
  };
}

export function branchFormToCreateDTO(data: BranchFormData): CreateBranchDTO {
  return {
    code: data.code.trim(),
    name: data.name.trim(),
    status: data.status,
    isMain: data.isMain,
    phone: trimOrUndefined(data.phone),
    email: trimOrUndefined(data.email),
    managerName: trimOrUndefined(data.managerName),
    notes: trimOrUndefined(data.notes),
    address: addressToApiPayload(data.address, data.name),
  };
}

export function branchFormToUpdateDTO(data: BranchFormData): UpdateBranchDTO {
  return {
    name: data.name.trim(),
    status: data.status,
    isMain: data.isMain,
    phone: trimOrNull(data.phone),
    email: trimOrNull(data.email),
    managerName: trimOrNull(data.managerName),
    notes: trimOrNull(data.notes),
    address: addressToApiPayload(data.address, data.name),
  };
}
