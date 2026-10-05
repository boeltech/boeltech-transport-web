import { Link, useLocation } from "react-router-dom";
import { Badge } from "@shared/ui/badge";
import { Checkbox } from "@shared/ui/checkbox";
import { TableCell, TableRow } from "@shared/ui/table";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ApprovableItem } from "../../domain";
import { APPROVAL_STATUS_LABELS, type ApprovalStatus } from "../../domain";
import { approvalTypeConfig } from "../config/approvalTypeConfig";
import { approvalsCopy } from "../copy/approvalsCopy";
import {
  ApprovalActionsCell,
  ApprovalStatusCell,
  type ApprovalRowDecisionProps,
} from "./ApprovalRowCells";
import {
  SETTLEMENTS_LIST_PATH,
  settlementDetailPath,
} from "@features/settlements/application";

const copy = approvalsCopy.inbox;

export interface ApprovalRowCompensationProps extends ApprovalRowDecisionProps {
  item: ApprovableItem;
  selected: boolean;
  selectable: boolean;
  onSelectChange: (checked: boolean) => void;
}

export function ApprovalRowCompensation({
  item,
  selected,
  selectable,
  onSelectChange,
  ...decision
}: ApprovalRowCompensationProps) {
  const location = useLocation();
  const inboxHref = `${location.pathname}${location.search}`;

  if (item.context.approvableType !== "internal_staff_compensation") {
    return null;
  }

  const ctx = item.context;
  const typeConfig = approvalTypeConfig.internal_staff_compensation;
  const TypeIcon = typeConfig.icon;
  const statusLabel =
    APPROVAL_STATUS_LABELS[item.status as ApprovalStatus] ?? item.status;

  const targetLink = ctx.settlementId
    ? settlementDetailPath(ctx.settlementId)
    : SETTLEMENTS_LIST_PATH;

  const isReimbursementOnly = ctx.settlementKind === "reimbursement_only";
  const periodLabel =
    isReimbursementOnly && ctx.createdAt
      ? formatDate(ctx.createdAt)
      : ctx.periodStart && ctx.periodEnd && !isReimbursementOnly
        ? `${formatDate(ctx.periodStart)} – ${formatDate(ctx.periodEnd)}`
        : copy.table.noDescription;

  return (
    <TableRow>
      <TableCell className="w-10">
        {selectable ? (
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectChange(checked === true)}
            aria-label={`${copy.table.select} ${ctx.settlementNumber ?? item.id}`}
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
          to={targetLink}
          state={{ from: inboxHref }}
          className="font-medium text-primary hover:underline"
        >
          {ctx.settlementNumber || "Liquidación"}
        </Link>
        {isReimbursementOnly ? (
          <Badge variant="neutral" tone="soft" className="ml-1.5 text-[10px] font-normal">
            {copy.table.reimbursementSettlementBadge}
          </Badge>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {ctx.employeeFullName ?? "—"}
          {typeof ctx.tripsCount === "number" && !isReimbursementOnly
            ? ` · ${ctx.tripsCount} viajes`
            : ""}
        </p>
        {/* Sub-línea de balance operativo */}
        {typeof ctx.grossAmount === "number" && typeof ctx.totalDeductions === "number" ? (
          <p className="text-[11px] text-muted-foreground font-medium">
            <span className="text-foreground">
              {isReimbursementOnly ? "Reembolsos" : "Viajes"} {formatMxCurrency(ctx.grossAmount)}
            </span>
            {ctx.totalDeductions > 0 ? (
              <span className="text-destructive"> · Descuentos -{formatMxCurrency(ctx.totalDeductions)}</span>
            ) : null}
          </p>
        ) : null}
      </TableCell>
      <TableCell>Liquidación</TableCell>
      <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
        {periodLabel}
      </TableCell>
      <TableCell className="text-right tabular-nums font-medium">
        {formatMxCurrency(item.amount)}
      </TableCell>
      <TableCell>{formatDate(item.submittedAt)}</TableCell>
      <ApprovalStatusCell statusLabel={statusLabel} item={item} />
      <ApprovalActionsCell item={item} {...decision} />
    </TableRow>
  );
}
