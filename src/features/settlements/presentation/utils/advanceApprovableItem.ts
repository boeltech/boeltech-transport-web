import type { ApprovableItem } from "@features/approvals";
import type { DriverAdvance } from "../../domain/entities";

/**
 * Stub para `DecisionReasonSheet` / `approvalGuardsFor` desde la tabla de
 * anticipos: lleva `approval` + `approvalRevision` para las guardas ADR-0099.
 */
export function driverAdvanceToApprovableItem(advance: DriverAdvance): ApprovableItem {
  return {
    approvableType: "driver_advance_request",
    id: advance.id,
    amount: advance.amount,
    currency: (advance.currency as ApprovableItem["currency"]) ?? "MXN",
    category: advance.category,
    status: "pending",
    submittedAt: advance.submittedAt ?? advance.createdAt,
    submittedBy: advance.submittedBy ?? null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    context: {
      approvableType: "driver_advance_request",
      advanceId: advance.id,
      folio: advance.folio,
      employeeId: advance.employeeId,
      employeeFullName: advance.employeeFullName,
      category: advance.category,
      tripId: advance.tripId,
      tripCode: advance.tripCode ?? null,
      paymentMethod: advance.paymentMethod,
      notes: advance.notes,
    },
    ...(advance.approval !== undefined ? { approval: advance.approval } : {}),
    ...(advance.approvalRevision !== undefined
      ? { approvalRevision: advance.approvalRevision }
      : {}),
  };
}
