import type { ApprovableItem } from "@features/approvals";
import type { TripExpense } from "@features/trips/domain";

/**
 * Stub mínimo para `DecisionReasonSheet` / `approvalGuardsFor`: valida targets y
 * lleva `approval` + `approvalRevision` para las guardas ADR-0099.
 */
export function tripExpenseToRejectApprovableItem(
  expense: TripExpense,
  tripId: string,
  tripCode?: string,
): ApprovableItem {
  return {
    approvableType: "trip_expense",
    id: expense.id,
    amount: expense.amount,
    currency: expense.currency,
    category: expense.category,
    status: "pending",
    submittedAt: expense.createdAt.toISOString(),
    submittedBy: null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    context: {
      approvableType: "trip_expense",
      tripId,
      tripCode: tripCode ?? "",
      driverId: null,
      driverFullName: null,
      vehicleId: null,
      vehicleUnitNumber: null,
      expenseCategory: expense.category,
      description: expense.description,
      occurredAt: expense.expenseDate.toISOString(),
    },
    ...(expense.approval !== undefined ? { approval: expense.approval } : {}),
    ...(expense.approvalRevision !== undefined
      ? { approvalRevision: expense.approvalRevision }
      : {}),
  };
}
