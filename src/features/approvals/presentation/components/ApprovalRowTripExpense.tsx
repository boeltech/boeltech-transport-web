import { Link, useLocation } from "react-router-dom";
import { FileCheck, Receipt as ReceiptIcon, FileText } from "lucide-react";
import { Badge } from "@shared/ui/badge";
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
import { approvalTypeConfig } from "../config/approvalTypeConfig";
import { approvalsCopy } from "../copy/approvalsCopy";
import {
  ApprovalActionsCell,
  ApprovalStatusCell,
  type ApprovalRowDecisionProps,
} from "./ApprovalRowCells";

const copy = approvalsCopy.inbox;

export interface ApprovalRowTripExpenseProps extends ApprovalRowDecisionProps {
  item: ApprovableItem;
  selected: boolean;
  selectable: boolean;
  onSelectChange: (checked: boolean) => void;
  hideTypeColumn?: boolean;
}

export function ApprovalRowTripExpense({
  item,
  selected,
  selectable,
  onSelectChange,
  hideTypeColumn = true,
  ...decision
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
      {hideTypeColumn ? null : (
        <TableCell>
          <Badge
            variant={typeConfig.badge.variant}
            tone={typeConfig.badge.tone ?? "soft"}
          >
            <TypeIcon className="mr-1 h-3 w-3" />
            {typeConfig.label}
          </Badge>
        </TableCell>
      )}
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
      <ApprovalStatusCell statusLabel={statusLabel} item={item} />
      <ApprovalActionsCell item={item} {...decision} />
    </TableRow>
  );
}
