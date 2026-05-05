import type { EmployeeRef } from "../../domain/entities";

/**
 * Número preferido para contacto operativo: celular si existe, si no teléfono fijo.
 */
export function employeePrimaryContactDisplay(
  employee: Pick<EmployeeRef, "mobilePhone" | "phone"> | null | undefined,
): string | null {
  if (!employee) return null;
  const mobile = employee.mobilePhone?.trim();
  if (mobile) return mobile;
  const phone = employee.phone?.trim();
  if (phone) return phone;
  return null;
}
