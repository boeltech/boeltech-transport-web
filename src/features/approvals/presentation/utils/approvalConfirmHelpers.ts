import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategoryType,
} from "@features/trips/domain";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ApprovableItem } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";

const copy = approvalsCopy.inbox.actions;

/** Maker-checker: el solicitante no puede autorizar/rechazar su propio ítem. */
export function isSelfSubmittedApproval(
  item: ApprovableItem,
  userId: string | null | undefined,
): boolean {
  return Boolean(userId && item.submittedBy && item.submittedBy === userId);
}

/**
 * D3′ (liquidaciones): si hay un solo autorizador activo, no bloquear self-submit
 * de `internal_staff_compensation`. Anticipos y gastos siguen bloqueados.
 */
export function blocksSelfSubmittedApproval(
  item: ApprovableItem,
  userId: string | null | undefined,
  options?: { activeApproverCount?: number | null },
): boolean {
  if (!isSelfSubmittedApproval(item, userId)) return false;
  if (
    item.approvableType === "internal_staff_compensation" &&
    options?.activeApproverCount === 1
  ) {
    return false;
  }
  return true;
}

export function formatApprovableApproveConfirmDescription(
  item: ApprovableItem | null,
): string {
  if (!item) return copy.approveConfirmDescription("trip_expense");

  if (item.context.approvableType === "trip_expense") {
    const ctx = item.context;
    const categoryLabel =
      EXPENSE_CATEGORY_LABELS[ctx.expenseCategory as ExpenseCategoryType] ??
      item.category;

    return copy.approveConfirmDescriptionContext({
      tripCode: ctx.tripCode,
      category: categoryLabel,
      amount: formatMxCurrency(item.amount),
      description: ctx.description?.trim() || undefined,
    });
  }

  if (item.context.approvableType === "driver_advance_request") {
    const ctx = item.context;
    const parts = [
      ctx.folio ?? "Anticipo",
      ctx.employeeFullName ?? "Operador",
      formatMxCurrency(item.amount),
    ];
    if (ctx.tripCode) parts.push(`Viaje: ${ctx.tripCode}`);
    if (ctx.notes) parts.push(ctx.notes.trim());

    return `${parts.join(" · ")}. ${copy.approveConfirmDescription("driver_advance_request")}`;
  }

  if (item.context.approvableType === "internal_staff_compensation") {
    const ctx = item.context;
    const parts = [
      ctx.settlementNumber ?? "Liquidación",
      ctx.employeeFullName ?? "Operador",
      formatMxCurrency(item.amount),
    ];
    if (typeof ctx.tripsCount === "number") {
      parts.push(`${ctx.tripsCount} viajes`);
    }

    return `${parts.join(" · ")}. ${copy.approveConfirmDescription("internal_staff_compensation")}`;
  }

  return copy.approveConfirmDescription(item.approvableType);
}
