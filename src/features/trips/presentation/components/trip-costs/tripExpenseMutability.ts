import type { ApprovalBlock } from "@features/approvals";
import {
  canMutatePendingTripExpense,
  isExpenseNotMutableError,
  type ExpenseStatusType,
  type TripStatusType,
} from "@features/trips/domain";

import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.costs;

/** ADR-0099 D15: devuelto para corregir (flujo en `returned`). */
export function isReturnedExpense(item: { approval?: ApprovalBlock | null }): boolean {
  return item.approval?.flowStatus === "returned";
}

export interface TripExpenseRowMutabilityInput {
  /** Gate de página (RBAC + estado/ventana del viaje). */
  gate: boolean;
  tripStatus: TripStatusType | string;
  expenseStatus: ExpenseStatusType | undefined;
  closedAt?: Date | string | null;
  now?: Date | string;
  /** ADR-0099 TEC-5: gasto devuelto para corregir (ignora la ventana post-cierre). */
  returnedForCorrection?: boolean;
}

/**
 * ¿Se puede editar/eliminar este gasto? Gate de página + regla ADR-0043
 * por gasto con su estado real (decididos nunca son mutables).
 */
export function canMutateTripExpenseRow({
  gate,
  tripStatus,
  expenseStatus,
  closedAt,
  now,
  returnedForCorrection,
}: TripExpenseRowMutabilityInput): boolean {
  if (!gate || expenseStatus == null) return false;
  return canMutatePendingTripExpense({
    status: tripStatus as TripStatusType,
    expenseStatus,
    closedAt,
    now,
    returnedForCorrection,
  });
}

export type TripExpenseMutationAction = "edit" | "remove";

/** Descripción del toast para errores de editar/eliminar gasto. */
export function describeExpenseMutationError(
  error: unknown,
  action: TripExpenseMutationAction,
): string | undefined {
  if (isExpenseNotMutableError(error)) {
    return action === "edit"
      ? copy.toast.expenseNotMutableEdit
      : copy.toast.expenseNotMutableRemove;
  }
  return error instanceof Error ? error.message : undefined;
}
