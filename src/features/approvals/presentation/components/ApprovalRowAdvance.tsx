import { Link, useLocation } from "react-router-dom";
import { AlertCircle } from "lucide-react";
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

const copy = approvalsCopy.inbox;

export interface ApprovalRowAdvanceProps extends ApprovalRowDecisionProps {
  item: ApprovableItem;
  selected: boolean;
  selectable: boolean;
  onSelectChange: (checked: boolean) => void;
}

export function ApprovalRowAdvance({
  item,
  selected,
  selectable,
  onSelectChange,
  ...decision
}: ApprovalRowAdvanceProps) {
  const location = useLocation();
  const inboxHref = `${location.pathname}${location.search}`;

  if (item.context.approvableType !== "driver_advance_request") {
    return null;
  }

  const ctx = item.context;
  const typeConfig = approvalTypeConfig.driver_advance_request;
  const TypeIcon = typeConfig.icon;
  const statusLabel =
    APPROVAL_STATUS_LABELS[item.status as ApprovalStatus] ?? item.status;

  const openBalance = ctx.openAdvancesBalance;
  const hasOpenDebt = typeof openBalance === "number" && openBalance > 0;

  return (
    <TableRow>
      <TableCell className="w-10">
        {selectable ? (
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectChange(checked === true)}
            aria-label={`${copy.table.select} ${ctx.folio ?? item.id}`}
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
        <span className="font-semibold text-primary font-mono">
          {ctx.folio || "Anticipo"}
        </span>
        <p className="text-xs text-muted-foreground font-medium">
          {ctx.employeeFullName ?? "—"}
        </p>

        {/* Micro-señal de saldo deudor abierto del chofer (D2) */}
        {typeof openBalance === "number" ? (
          hasOpenDebt ? (
            <div className="mt-1 flex items-center gap-1">
              <Badge variant="warning" tone="soft" className="text-[11px] h-5 px-1.5 gap-1 font-medium">
                <AlertCircle className="h-3 w-3 text-warning-foreground" />
                {copy.table.openDebtAlert(
                  formatMxCurrency(openBalance),
                  ctx.openAdvancesCount,
                )}
              </Badge>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              {copy.table.noOpenDebt}
            </p>
          )
        ) : null}

        {ctx.tripCode && ctx.tripId ? (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            <Link
              to={`/trips/${ctx.tripId}`}
              state={{ from: inboxHref }}
              className="text-primary hover:underline font-mono"
            >
              Viaje: {ctx.tripCode}
            </Link>
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
            Gasto general / Sin viaje
          </p>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-0.5">
          <span className="capitalize block">{ctx.category ?? "Anticipo de viaje"}</span>
          {ctx.paymentMethod ? (
            <span className="text-[11px] text-muted-foreground capitalize block">
              Método: {ctx.paymentMethod}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
        {ctx.notes || copy.table.noDescription}
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
