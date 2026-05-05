import { z } from "zod";
import { BranchStatus, type CreateBranchDTO, type UpdateBranchDTO } from "../../domain";

export const branchFormSchema = z.object({
  code: z
    .string()
    .min(2, "El código es requerido")
    .max(20, "Máximo 20 caracteres"),
  name: z
    .string()
    .min(2, "El nombre es requerido")
    .max(120, "Máximo 120 caracteres"),
  status: z.enum([BranchStatus.ACTIVE, BranchStatus.INACTIVE]),
  isMain: z.boolean().default(false),
  street: z
    .string()
    .min(3, "La calle es requerida")
    .max(150, "Máximo 150 caracteres"),
  exteriorNumber: z.string().max(20).optional().or(z.literal("")),
  interiorNumber: z.string().max(20).optional().or(z.literal("")),
  neighborhood: z.string().max(120).optional().or(z.literal("")),
  city: z
    .string()
    .min(2, "La ciudad es requerida")
    .max(100, "Máximo 100 caracteres"),
  state: z
    .string()
    .min(2, "El estado es requerido")
    .max(100, "Máximo 100 caracteres"),
  postalCode: z
    .string()
    .min(4, "Código postal inválido")
    .max(10, "Máximo 10 caracteres"),
  country: z
    .string()
    .min(2, "El país es requerido")
    .max(80, "Máximo 80 caracteres"),
  phone: z.string().max(25).optional().or(z.literal("")),
  email: z.email("Correo inválido").optional().or(z.literal("")),
  managerName: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type BranchFormData = z.infer<typeof branchFormSchema>;

export const defaultBranchFormValues: BranchFormData = {
  code: "",
  name: "",
  status: BranchStatus.ACTIVE,
  isMain: false,
  street: "",
  exteriorNumber: "",
  interiorNumber: "",
  neighborhood: "",
  city: "",
  state: "",
  postalCode: "",
  country: "México",
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

export function branchFormToCreateDTO(data: BranchFormData): CreateBranchDTO {
  return {
    code: data.code.trim(),
    name: data.name.trim(),
    status: data.status,
    isMain: data.isMain,
    street: data.street.trim(),
    exteriorNumber: trimOrUndefined(data.exteriorNumber),
    interiorNumber: trimOrUndefined(data.interiorNumber),
    neighborhood: trimOrUndefined(data.neighborhood),
    city: data.city.trim(),
    state: data.state.trim(),
    postalCode: data.postalCode.trim(),
    country: data.country.trim(),
    phone: trimOrUndefined(data.phone),
    email: trimOrUndefined(data.email),
    managerName: trimOrUndefined(data.managerName),
    notes: trimOrUndefined(data.notes),
  };
}

export function branchFormToUpdateDTO(data: BranchFormData): UpdateBranchDTO {
  return {
    name: data.name.trim(),
    status: data.status,
    isMain: data.isMain,
    street: data.street.trim(),
    exteriorNumber: trimOrNull(data.exteriorNumber),
    interiorNumber: trimOrNull(data.interiorNumber),
    neighborhood: trimOrNull(data.neighborhood),
    city: data.city.trim(),
    state: data.state.trim(),
    postalCode: data.postalCode.trim(),
    country: data.country.trim(),
    phone: trimOrNull(data.phone),
    email: trimOrNull(data.email),
    managerName: trimOrNull(data.managerName),
    notes: trimOrNull(data.notes),
  };
}
