import { Link, useLocation } from "react-router-dom";
import { Check, X, FileCheck, Receipt as ReceiptIcon, FileText } from "lucide-react";
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
  const location = useLocation();
  /** Devuelve a la bandeja con los filtros con los que se abrió el viaje. */
  const inboxHref = `${location.pathname}${location.search}`;

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

  // Micro-señal de soporte documental (D3)
  const isCfdi = ctx.hasInvoice || ctx.receiptType === "cfdi";
  const isTicket = ctx.receiptType === "ticket" || Boolean(ctx.receiptNumber);
  const isDocumented = item.status === "documented";

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
          to={`/trips/${ctx.tripId}?tab=costs`}
          state={{ from: inboxHref }}
          className="font-medium text-primary hover:underline font-mono"
        >
          {ctx.tripCode}
        </Link>
        <p className="text-xs text-muted-foreground">
          {ctx.driverFullName ?? "—"}
          {ctx.vehicleUnitNumber ? ` · ${ctx.vehicleUnitNumber}` : ""}
        </p>
      </TableCell>
      <TableCell>
        <span className="block font-medium">{categoryLabel}</span>
        {/* Badge soporte documental (D3) */}
        <div className="mt-1">
          {isCfdi ? (
            <Badge variant="info" tone="soft" className="text-[11px] h-5 px-1.5 gap-1">
              <FileCheck className="h-3 w-3 text-primary" />
              {copy.table.receiptCfdi}
            </Badge>
          ) : isTicket ? (
            <Badge variant="warning" tone="soft" className="text-[11px] h-5 px-1.5 gap-1">
              <ReceiptIcon className="h-3 w-3 text-warning-foreground" />
              {copy.table.receiptTicket}
            </Badge>
          ) : isDocumented ? (
            <Badge variant="neutral" tone="soft" className="text-[11px] h-5 px-1.5 gap-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              Comprobado
            </Badge>
          ) : (
            <Badge variant="neutral" tone="soft" className="text-[11px] h-5 px-1.5 text-muted-foreground/80 opacity-80">
              {copy.table.receiptNone}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
        {ctx.description ?? copy.table.noDescription}
      </TableCell>
      <TableCell className="text-right tabular-nums font-medium">
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
