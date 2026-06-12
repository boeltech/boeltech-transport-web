import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategoryType,
} from "@features/trips/domain";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ApprovableItem } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";

const copy = approvalsCopy.inbox.actions;

export function formatApprovableApproveConfirmDescription(
  item: ApprovableItem | null,
): string {
  if (!item) return copy.approveConfirmDescription;

  if (item.context.approvableType !== "trip_expense") {
    return copy.approveConfirmDescription;
  }

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
