import type { ApprovableItem } from "@features/approvals";
import type { DriverSettlement } from "../../domain/entities";

/**
 * Stub para `DecisionReasonSheet` desde el detalle de liquidación: lleva
 * `approval` + `approvalRevision` para las guardas ADR-0099.
 */
export function settlementToApprovableItem(settlement: DriverSettlement): ApprovableItem {
  return {
    approvableType: "internal_staff_compensation",
    id: settlement.id,
    amount: settlement.netAmount,
    currency: (settlement.currency as ApprovableItem["currency"]) ?? "MXN",
    category: "internal_staff_compensation",
    status: "pending",
    submittedAt: settlement.submittedAt ?? settlement.createdAt,
    submittedBy: settlement.submittedBy ?? null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    context: {
      approvableType: "internal_staff_compensation",
      settlementId: settlement.id,
      settlementNumber: settlement.settlementNumber,
      employeeId: settlement.employeeId,
      employeeFullName: settlement.employeeFullName,
      periodStart: settlement.periodStart,
      periodEnd: settlement.periodEnd,
      tripsCount: settlement.tripsCount,
      grossAmount: settlement.grossAmount,
      totalDeductions: settlement.totalAdvancesDeducted + settlement.totalOtherDeductions,
      netAmount: settlement.netAmount,
    },
    ...(settlement.approval !== undefined ? { approval: settlement.approval } : {}),
    ...(settlement.approvalRevision !== undefined
      ? { approvalRevision: settlement.approvalRevision }
      : {}),
  };
}
