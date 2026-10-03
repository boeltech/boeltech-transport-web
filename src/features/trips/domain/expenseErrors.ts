/** API 409 (abierto) / 400 (post-cierre): el gasto ya no admite editar ni eliminar. */
export const EXPENSE_NOT_MUTABLE_CODE = "EXPENSE_NOT_MUTABLE";

export function isExpenseNotMutableError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  return (error as { code?: unknown }).code === EXPENSE_NOT_MUTABLE_CODE;
}
