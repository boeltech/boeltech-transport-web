import { memo } from "react";
import { Check, Edit2, Receipt, Trash2, X } from "lucide-react";

import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  type ExpenseCategoryType,
  type ExpenseStatusType,
} from "@features/trips/domain";
import { formatDateTime } from "@shared/utils/dateUtils";

import { EXPENSE_CATEGORY_MAP, formatMxCurrency } from "../trip-financial";
import type { TripExpenseFormValues } from "../../pages/create/components/validation";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.costs;

export interface TripExpenseListItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  vendorName?: string;
  status?: ExpenseStatusType;
  isEstimated?: boolean;
  expenseDate?: Date;
  hasReceipt?: boolean;
}

export interface TripExpenseEditableListProps {
  items: TripExpenseListItem[];
  emptyTitle: string;
  emptyDescription: string;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  /** Si se omite, edit/remove siguen `readOnly` + presencia de handlers. */
  canEditItem?: (item: TripExpenseListItem) => boolean;
  canRemoveItem?: (item: TripExpenseListItem) => boolean;
  readOnly?: boolean;
  showDetailMeta?: boolean;
  /** Deshabilita acciones mientras hay una mutación en curso. */
  actionsDisabled?: boolean;
}

function getExpenseStatusVariant(
  status: ExpenseStatusType,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    case "pending":
    case "documented":
    default:
      return "secondary";
  }
}

function statusBadgeLabel(status: ExpenseStatusType): string {
  if (status === "pending") return copy.state.inReview;
  if (status === "documented") return copy.state.documented;
  return EXPENSE_STATUS_LABELS[status] ?? status;
}

function statusFinanceHint(status: ExpenseStatusType): string | null {
  if (status === "pending") return copy.state.inReviewHint;
  if (status === "documented") return copy.state.documentedHint;
  return null;
}

const TripExpenseEditableListItem = memo(function TripExpenseEditableListItem({
  expense,
  showDetailMeta,
  canEdit,
  canRemove,
  onEdit,
  onRemove,
  onApprove,
  onReject,
  actionsDisabled = false,
}: {
  expense: TripExpenseListItem;
  showDetailMeta: boolean;
  canEdit: boolean;
  canRemove: boolean;
  actionsDisabled?: boolean;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}) {
  const canApprove =
    expense.status === "pending" && onApprove != null && onReject != null;
  const category = EXPENSE_CATEGORY_MAP.get(
    expense.category as TripExpenseFormValues["category"],
  );
  const financeHint =
    showDetailMeta && expense.status
      ? statusFinanceHint(expense.status)
      : null;

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="shrink-0 rounded-lg bg-muted p-2">
        {category ? (
          <category.icon className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Receipt className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{expense.description}</p>
          {showDetailMeta && expense.status ? (
            <Badge
              variant={getExpenseStatusVariant(expense.status)}
              className="text-xs font-normal"
              title={financeHint ?? undefined}
            >
              {statusBadgeLabel(expense.status)}
            </Badge>
          ) : null}
          {showDetailMeta && expense.isEstimated ? (
            <Badge variant="secondary" className="text-xs font-normal">
              {copy.state.estimated}
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {category?.label ||
            EXPENSE_CATEGORY_LABELS[expense.category as ExpenseCategoryType] ||
            copy.state.noCategory}
          {expense.vendorName ? ` · ${expense.vendorName}` : ""}
        </p>
        {financeHint ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{financeHint}</p>
        ) : null}
        {showDetailMeta && (expense.expenseDate || expense.hasReceipt) ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {expense.expenseDate
              ? formatDateTime(expense.expenseDate.toISOString())
              : null}
            {expense.expenseDate && expense.hasReceipt ? " · " : null}
            {expense.hasReceipt ? copy.state.receipt : null}
          </p>
        ) : null}
      </div>
      <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
        -{formatMxCurrency(expense.amount)}
      </span>
      <div className="flex shrink-0 items-start gap-2">
        {canApprove ? (
          <div
            className="flex gap-0.5 rounded-md border border-border bg-muted/50 p-0.5"
            role="group"
            aria-label={copy.action.reviewGroup}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-success hover:text-success"
              disabled={actionsDisabled}
              onClick={() => onApprove(expense.id)}
              aria-label={copy.action.approve}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              disabled={actionsDisabled}
              onClick={() => onReject(expense.id)}
              aria-label={copy.action.reject}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}
        {canEdit || canRemove ? (
          <div className="flex gap-0.5">
            {canEdit && onEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={actionsDisabled}
                onClick={() => onEdit(expense.id)}
                aria-label={copy.action.edit}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            {canRemove && onRemove ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                disabled={actionsDisabled}
                onClick={() => onRemove(expense.id)}
                aria-label={copy.action.remove}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
});

export function TripExpenseEditableList({
  items,
  emptyTitle,
  emptyDescription,
  onEdit,
  onRemove,
  onApprove,
  onReject,
  canEditItem,
  canRemoveItem,
  readOnly = false,
  showDetailMeta = false,
  actionsDisabled = false,
}: TripExpenseEditableListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Receipt />}
        size="sm"
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="divide-y rounded-lg border px-4">
      {items.map((expense) => {
        const canEdit =
          !readOnly &&
          onEdit != null &&
          (canEditItem ? canEditItem(expense) : true);
        const canRemove =
          !readOnly &&
          onRemove != null &&
          (canRemoveItem ? canRemoveItem(expense) : true);
        return (
          <TripExpenseEditableListItem
            key={expense.id}
            expense={expense}
            showDetailMeta={showDetailMeta}
            canEdit={canEdit}
            canRemove={canRemove}
            actionsDisabled={actionsDisabled}
            onEdit={onEdit}
            onRemove={onRemove}
            onApprove={onApprove}
            onReject={onReject}
          />
        );
      })}
    </div>
  );
}
