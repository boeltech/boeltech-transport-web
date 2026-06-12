import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { TableCell, TableRow } from "@shared/ui/table";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  type ExpenseCategoryType,
  type ExpenseStatusType,
} from "@features/trips/domain";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ApprovableItem } from "../../domain";
import { isApprovableActionable } from "../../domain";
import { approvalTypeConfig } from "../config/approvalTypeConfig";
import { approvalsCopy } from "../copy/approvalsCopy";

const copy = approvalsCopy.inbox;

export interface ApprovalRowTripExpenseProps {
  item: ApprovableItem;
  selected: boolean;
  selectable: boolean;
  canUpdate: boolean;
  onSelectChange: (checked: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
}

export function ApprovalRowTripExpense({
  item,
  selected,
  selectable,
  canUpdate,
  onSelectChange,
  onApprove,
  onReject,
}: ApprovalRowTripExpenseProps) {
  if (item.context.approvableType !== "trip_expense") {
    return null;
  }

  const ctx = item.context;
  const typeConfig = approvalTypeConfig.trip_expense;
  const TypeIcon = typeConfig.icon;
  const categoryLabel =
    EXPENSE_CATEGORY_LABELS[ctx.expenseCategory as ExpenseCategoryType] ??
    item.category;
  const statusLabel =
    EXPENSE_STATUS_LABELS[item.status as ExpenseStatusType] ?? item.status;
  const actionable = canUpdate && isApprovableActionable(item);

  return (
    <TableRow>
      <TableCell className="w-10">
        {selectable ? (
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectChange(checked === true)}
            aria-label={`${copy.table.select} ${ctx.tripCode}`}
          />
        ) : null}
      </TableCell>
      <TableCell>
        <Badge
          variant={typeConfig.badge.variant}
          tone={typeConfig.badge.tone ?? "soft"}
        >
          <TypeIcon className="mr-1 h-3 w-3" />
          {typeConfig.label}
        </Badge>
      </TableCell>
      <TableCell>
        <Link
          to={`/trips/${ctx.tripId}`}
          className="font-medium text-primary hover:underline"
        >
          {ctx.tripCode}
        </Link>
        <p className="text-xs text-muted-foreground">
          {ctx.driverFullName ?? "—"}
          {ctx.vehicleUnitNumber ? ` · ${ctx.vehicleUnitNumber}` : ""}
        </p>
      </TableCell>
      <TableCell>{categoryLabel}</TableCell>
      <TableCell className="max-w-[220px] truncate">
        {ctx.description ?? copy.table.noDescription}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatMxCurrency(item.amount)}
      </TableCell>
      <TableCell>{formatDate(ctx.occurredAt)}</TableCell>
      <TableCell>
        <Badge variant="secondary">{statusLabel}</Badge>
      </TableCell>
      <TableCell className="text-right">
        {actionable ? (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onApprove}
              aria-label={copy.actions.approve}
              title={copy.actions.approve}
            >
              <Check className="h-4 w-4 text-success" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onReject}
              aria-label={copy.actions.reject}
              title={copy.actions.reject}
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
