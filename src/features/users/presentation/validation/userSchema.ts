import { z } from "zod";
import { ROLES, type UserRole } from "@shared/constants/roles";
import type { CreateUserDTO, UpdateUserDTO } from "../../domain";

const roleSchema = z.enum([
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.DISPATCHER,
  ROLES.ACCOUNTANT,
  ROLES.OPERATOR,
  ROLES.DRIVER,
  ROLES.CLIENT,
]);

function refineOwnershipLinks(
  data: { role: UserRole; clientId?: string; employeeId?: string },
  ctx: z.RefinementCtx,
): void {
  if (data.role === ROLES.CLIENT) {
    if (!data.clientId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona el cliente vinculado",
        path: ["clientId"],
      });
    }
  }
  if (data.role === ROLES.DRIVER) {
    if (!data.employeeId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona el empleado conductor vinculado",
        path: ["employeeId"],
      });
    }
  }
}

const userBaseSchema = z.object({
  firstName: z.string().min(1, "Nombre es requerido").max(100, "Máximo 100 caracteres"),
  lastName: z.string().min(1, "Apellido es requerido").max(100, "Máximo 100 caracteres"),
  email: z.string().min(1, "Correo es requerido").email("Correo inválido"),
  role: roleSchema.default(ROLES.OPERATOR),
  clientId: z.string().optional(),
  employeeId: z.string().optional(),
});

export const createUserFormSchema = userBaseSchema
  .extend({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(128, "Máximo 128 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Debe contener mayúscula, minúscula y número",
      ),
  })
  .superRefine((data, ctx) => refineOwnershipLinks(data, ctx));

export const updateUserFormSchema = userBaseSchema.superRefine((data, ctx) =>
  refineOwnershipLinks(data, ctx),
);

/** Refine: `role` must belong to `allowed` (Fase 2 jerarquía en UI). */
export function createUserFormSchemaWithRoleAllowlist(allowed: ReadonlySet<UserRole>) {
  return createUserFormSchema.superRefine((data, ctx) => {
    if (!allowed.has(data.role)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No puedes asignar este rol con tu usuario actual",
        path: ["role"],
      });
    }
  });
}

export function updateUserFormSchemaWithRoleAllowlist(allowed: ReadonlySet<UserRole>) {
  return updateUserFormSchema.superRefine((data, ctx) => {
    if (!allowed.has(data.role)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No puedes asignar este rol con tu usuario actual",
        path: ["role"],
      });
    }
  });
}

export type CreateUserFormData = z.infer<typeof createUserFormSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserFormSchema>;
export type UserFormData = UpdateUserFormData & {
  password?: string;
};

export const defaultCreateUserFormValues: UserFormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: ROLES.OPERATOR,
  clientId: undefined,
  employeeId: undefined,
};

export function userFormToCreateDTO(data: UserFormData): CreateUserDTO {
  if (!data.password) {
    throw new Error("La contraseña inicial es requerida");
  }

  return {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
    role: data.role as UserRole,
    clientId: data.role === ROLES.CLIENT ? data.clientId ?? null : null,
    employeeId: data.role === ROLES.DRIVER ? data.employeeId ?? null : null,
  };
}

export function userFormToUpdateDTO(data: UserFormData): UpdateUserDTO {
  return {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email.trim().toLowerCase(),
    role: data.role as UserRole,
    clientId: data.role === ROLES.CLIENT ? data.clientId ?? null : null,
    employeeId: data.role === ROLES.DRIVER ? data.employeeId ?? null : null,
  };
}
