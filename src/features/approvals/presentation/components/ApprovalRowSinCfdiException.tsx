import { Link, useLocation } from "react-router-dom";
import { Badge } from "@shared/ui/badge";
import { TableCell, TableRow } from "@shared/ui/table";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ApprovableItem } from "../../domain";
import { APPROVAL_STATUS_LABELS, type ApprovalStatus } from "../../domain";
import { approvalTypeConfig } from "../config/approvalTypeConfig";
import {
  ApprovalActionsCell,
  ApprovalStatusCell,
  type ApprovalRowDecisionProps,
} from "./ApprovalRowCells";

export interface ApprovalRowSinCfdiExceptionProps extends ApprovalRowDecisionProps {
  item: ApprovableItem;
  selected: boolean;
  selectable: boolean;
  onSelectChange: (checked: boolean) => void;
  hideTypeColumn?: boolean;
}

export function ApprovalRowSinCfdiException({
  item,
  hideTypeColumn = true,
  canUpdate,
  selfActionUi,
  actionUi,
  onApprove,
  onReject,
  onReturn,
  onHistory,
}: ApprovalRowSinCfdiExceptionProps) {
  const location = useLocation();
  if (item.context.approvableType !== "sin_cfdi_exception") return null;
  const ctx = item.context;
  const typeConfig = approvalTypeConfig.sin_cfdi_exception;
  const TypeIcon = typeConfig.icon;
  const inboxHref = `${location.pathname}${location.search}`;
  const statusLabel =
    APPROVAL_STATUS_LABELS[item.status as ApprovalStatus] ?? item.status;

  return (
    <TableRow>
      <TableCell className="w-10" />
      {hideTypeColumn ? null : (
        <TableCell>
          <Badge variant={typeConfig.badge.variant} tone={typeConfig.badge.tone ?? "soft"}>
            <TypeIcon className="mr-1 h-3 w-3" />
            {typeConfig.label}
          </Badge>
        </TableCell>
      )}
      <TableCell>
        <Link
          to={`/trips/${ctx.tripId}`}
          state={{ from: inboxHref }}
          className="font-semibold text-primary font-mono"
        >
          {ctx.tripCode}
        </Link>
        <p className="text-xs text-muted-foreground">{ctx.clientLegalName ?? "—"}</p>
      </TableCell>
      <TableCell className="text-sm">Excepción Sin factura</TableCell>
      <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
        {ctx.reason}
      </TableCell>
      <TableCell className="text-right tabular-nums font-medium">
        {formatMxCurrency(item.amount)}
      </TableCell>
      <TableCell>{formatDate(item.submittedAt)}</TableCell>
      <ApprovalStatusCell statusLabel={statusLabel} item={item} />
      <ApprovalActionsCell
        item={item}
        canUpdate={canUpdate}
        selfActionUi={selfActionUi}
        actionUi={actionUi}
        onApprove={onApprove}
        onReject={onReject}
        onReturn={onReturn}
        onHistory={onHistory}
      />
    </TableRow>
  );
}
