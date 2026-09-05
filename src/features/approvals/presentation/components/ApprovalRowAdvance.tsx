import { Link, useLocation } from "react-router-dom";
import { Check, X, AlertCircle } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { TableCell, TableRow } from "@shared/ui/table";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ApprovableItem } from "../../domain";
import {
  APPROVAL_STATUS_LABELS,
  isApprovableActionable,
  type ApprovalStatus,
} from "../../domain";
import { approvalTypeConfig } from "../config/approvalTypeConfig";
import { approvalsCopy } from "../copy/approvalsCopy";

const copy = approvalsCopy.inbox;

export interface ApprovalRowAdvanceProps {
  item: ApprovableItem;
  selected: boolean;
  selectable: boolean;
  canUpdate: boolean;
  onSelectChange: (checked: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
}

export function ApprovalRowAdvance({
  item,
  selected,
  selectable,
  canUpdate,
  onSelectChange,
  onApprove,
  onReject,
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
  const actionable = canUpdate && isApprovableActionable(item);

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
