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
  readOnly?: boolean;
  showDetailMeta?: boolean;
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
    default:
      return "secondary";
  }
}

const TripExpenseEditableListItem = memo(function TripExpenseEditableListItem({
  expense,
  showDetailMeta,
  readOnly,
  onEdit,
  onRemove,
  onApprove,
  onReject,
}: {
  expense: TripExpenseListItem;
  showDetailMeta: boolean;
  readOnly: boolean;
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
            >
              {EXPENSE_STATUS_LABELS[expense.status] ?? expense.status}
            </Badge>
          ) : null}
          {showDetailMeta && expense.isEstimated ? (
            <Badge variant="secondary" className="text-xs font-normal">
              {copy.state.estimated}
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {category?.label || EXPENSE_CATEGORY_LABELS[expense.category as ExpenseCategoryType] || copy.state.noCategory}
          {expense.vendorName ? ` · ${expense.vendorName}` : ""}
        </p>
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
      {canApprove ? (
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-success hover:text-success"
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
            onClick={() => onReject(expense.id)}
            aria-label={copy.action.reject}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}
      {!readOnly && (onEdit || onRemove) ? (
        <div className="flex shrink-0 gap-1">
          {onEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(expense.id)}
              aria-label={copy.action.edit}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          {onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onRemove(expense.id)}
              aria-label={copy.action.remove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      ) : null}
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
  readOnly = false,
  showDetailMeta = false,
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
      {items.map((expense) => (
        <TripExpenseEditableListItem
          key={expense.id}
          expense={expense}
          showDetailMeta={showDetailMeta}
          readOnly={readOnly}
          onEdit={onEdit}
          onRemove={onRemove}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
