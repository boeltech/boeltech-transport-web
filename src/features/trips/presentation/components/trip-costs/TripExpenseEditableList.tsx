import { memo, useMemo } from "react";
import { Edit2, MoreHorizontal, Receipt, Trash2 } from "lucide-react";

import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import {
  ApprovalActionStateChip,
  ApprovalFlowLines,
  ReturnedAlert,
  SelfApprovedBadge,
  approvalsCopy,
  resolveApprovalActionUi,
  showsSelfApprovedBadge,
  type ApprovalActionUi,
  type ApprovalBlock,
  type SelfActionUi,
} from "@features/approvals";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  type ExpenseCategoryType,
  type ExpenseStatusType,
  type PaymentSource,
} from "@features/trips/domain";
import { formatDateTime } from "@shared/utils/dateUtils";

import { EXPENSE_CATEGORY_MAP, formatMxCurrency } from "../trip-financial";
import type { TripExpenseFormValues } from "../../pages/create/components/validation";
import { tripDetailCopy } from "../../copy";
import { isReturnedExpense } from "./tripExpenseMutability";

const copy = tripDetailCopy.costs;

export interface TripExpenseListItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  vendorName?: string;
  paymentSource?: PaymentSource;
  status?: ExpenseStatusType;
  expenseDate?: Date;
  hasReceipt?: boolean;
  createdBy?: string | null;
  selfSegregatedApproval?: boolean;
  /** ADR-0099: `undefined` = API sin bloque; se conserva el comportamiento previo. */
  approval?: ApprovalBlock | null;
  approvalRevision?: string | null;
  /** Porción de combustible del regreso vacío. El badge lee esta marca. */
  isEmptyReturn?: boolean;
}

export interface TripExpenseEditableListProps {
  items: TripExpenseListItem[];
  emptyTitle: string;
  emptyDescription: string;
  /** Pie Operate bajo la tabla (label + total). */
  footerLabel?: string;
  footerTotal?: number;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  /** ADR-0099 D14: «Devolver para corregir» en ⋯. */
  onReturn?: (id: string) => void;
  /** ADR-0099 D14: «Ver historial» (solo con `finance_approvals.read`). */
  onHistory?: (id: string) => void;
  /** ADR-0099 D15: «Corregir y reenviar» en la alerta del gasto devuelto. */
  onCorrectReturned?: (id: string) => void;
  /** Si se omite, edit/remove siguen `readOnly` + presencia de handlers. */
  canEditItem?: (item: TripExpenseListItem) => boolean;
  canRemoveItem?: (item: TripExpenseListItem) => boolean;
  /** TEC-5: el devuelto se evalúa sin ventana post-cierre. */
  canCorrectItem?: (item: TripExpenseListItem) => boolean;
  /** Pista por fila (p. ej. ventana post-cierre cerrada en gastos no devueltos). */
  getRowHint?: (item: TripExpenseListItem) => string | null;
  /** ADR-0098: resultado de `resolveSelfActionUi` por gasto (default `normal`). */
  getSelfActionUi?: (item: TripExpenseListItem) => SelfActionUi;
  readOnly?: boolean;
  showDetailMeta?: boolean;
  /** Deshabilita acciones mientras hay una mutación en curso. */
  actionsDisabled?: boolean;
}

function getExpenseStatusVariant(
  status: ExpenseStatusType,
): "success" | "destructive" | "warning" | "neutral" {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "destructive";
    case "pending":
      return "warning";
    case "documented":
    default:
      return "neutral";
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

function paymentSourceLabel(source: PaymentSource | undefined): string {
  if (source === "company") return copy.paymentSource.badgeCompany;
  if (source === "advance") return copy.paymentSource.badgeAdvance;
  if (source === "driver") return copy.paymentSource.driverShort;
  return "—";
}

/**
 * ADR-0099 D14: misma función que la bandeja. La política de autoaprobación
 * llega ya resuelta (`SelfActionUi`) y se traduce a su contexto.
 */
function resolveRowActionUi(
  expense: TripExpenseListItem,
  selfActionUi: SelfActionUi,
  canDecide: boolean,
): ApprovalActionUi {
  return resolveApprovalActionUi(expense.approval, {
    isOwn: selfActionUi !== "normal",
    selfPolicy: { allowed: selfActionUi === "self_confirm" },
    canDecide,
    isPending: expense.status === "pending",
  });
}

function deferOpen(open: (() => void) | undefined) {
  if (!open) return undefined;
  return () => {
    window.setTimeout(open, 0);
  };
}

type RowActionCtx = {
  showDetailMeta: boolean;
  canEdit: boolean;
  canRemove: boolean;
  canCorrect: boolean;
  rowHint: string | null;
  actionsDisabled: boolean;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onReturn?: (id: string) => void;
  onHistory?: (id: string) => void;
  onCorrectReturned?: (id: string) => void;
  selfActionUi: SelfActionUi;
};

const TripExpenseRowActions = memo(function TripExpenseRowActions({
  expense,
  ctx,
}: {
  expense: TripExpenseListItem;
  ctx: RowActionCtx;
}) {
  const {
    canEdit,
    canRemove,
    canCorrect,
    actionsDisabled,
    onEdit,
    onRemove,
    onApprove,
    onReject,
    onReturn,
    onHistory,
    onCorrectReturned,
    selfActionUi,
  } = ctx;

  const returned = isReturnedExpense(expense);
  const canReview =
    expense.status === "pending" && onApprove != null && onReject != null;
  const actionUi = resolveRowActionUi(expense, selfActionUi, canReview);
  const canAct = canReview && actionUi.kind === "act";
  const showStateChip = canReview && !canAct;
  const openReturn =
    canAct && onReturn && expense.approval !== undefined
      ? deferOpen(() => onReturn(expense.id))
      : undefined;
  const openReject = canAct && onReject ? deferOpen(() => onReject(expense.id)) : undefined;
  const openHistory =
    onHistory && expense.approval ? deferOpen(() => onHistory(expense.id)) : undefined;
  const hasMenu = Boolean(openReturn || openReject || openHistory);
  const showCorrect = returned && canCorrect && onCorrectReturned != null;
  const showEdit = canEdit && onEdit != null && !showCorrect;
  const showRemove = canRemove && onRemove != null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex shrink-0 items-center justify-end gap-1">
        {showStateChip ? <ApprovalActionStateChip actionUi={actionUi} /> : null}
        {canAct ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={actionsDisabled}
            onClick={() => onApprove?.(expense.id)}
          >
            {copy.action.approve}
          </Button>
        ) : null}
        {showEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={actionsDisabled}
            onClick={() => onEdit?.(expense.id)}
            aria-label={copy.action.edit}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
        {showRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            disabled={actionsDisabled}
            onClick={() => onRemove?.(expense.id)}
            aria-label={copy.action.remove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
        {hasMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={actionsDisabled}
                aria-label={copy.action.more}
                title={copy.action.more}
              >
                {copy.action.more}
                <MoreHorizontal className="ml-1 h-3.5 w-3.5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {openReturn ? (
                <DropdownMenuItem onSelect={openReturn}>
                  {approvalsCopy.flow.menu.return}
                </DropdownMenuItem>
              ) : null}
              {openHistory ? (
                <DropdownMenuItem onSelect={openHistory}>
                  {approvalsCopy.flow.menu.history}
                </DropdownMenuItem>
              ) : null}
              {(openReturn || openHistory) && openReject ? (
                <DropdownMenuSeparator />
              ) : null}
              {openReject ? (
                <DropdownMenuItem
                  onSelect={openReject}
                  className="text-destructive focus:text-destructive"
                >
                  {copy.action.reject}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {returned ? (
        <ReturnedAlert
          className="max-w-xs text-left"
          approval={expense.approval}
          action={
            showCorrect ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={actionsDisabled}
                onClick={() => onCorrectReturned?.(expense.id)}
              >
                {approvalsCopy.flow.correctAndResubmit}
              </Button>
            ) : null
          }
        />
      ) : null}
    </div>
  );
});

function buildExpenseColumns(
  ctxForRow: (item: TripExpenseListItem) => RowActionCtx,
  showDetailMeta: boolean,
): EntityListColumnDef<TripExpenseListItem>[] {
  return [
    {
      id: "concept",
      header: copy.table.concept,
      kind: "stacked",
      accessor: (expense): EntityListStackedValue => {
        const category = EXPENSE_CATEGORY_MAP.get(
          expense.category as TripExpenseFormValues["category"],
        );
        const categoryLabel =
          category?.label ||
          EXPENSE_CATEGORY_LABELS[expense.category as ExpenseCategoryType] ||
          copy.state.noCategory;
        const secondaryBits = [
          categoryLabel,
          expense.vendorName?.trim() || null,
        ].filter(Boolean);
        return {
          primary: (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span>{expense.description}</span>
              {expense.isEmptyReturn ? (
                <Badge variant="neutral" tone="soft">
                  {copy.emptyReturn.badge}
                </Badge>
              ) : null}
            </span>
          ),
          secondary: secondaryBits.join(" · "),
        };
      },
    },
    {
      id: "date",
      header: copy.table.date,
      kind: "meta",
      className: "w-[9rem]",
      accessor: (expense) =>
        expense.expenseDate
          ? formatDateTime(expense.expenseDate.toISOString())
          : null,
    },
    {
      id: "fundedBy",
      header: copy.table.fundedBy,
      kind: "stacked",
      className: "w-[10rem]",
      accessor: (expense): EntityListStackedValue => ({
        primary: paymentSourceLabel(expense.paymentSource),
        secondary:
          expense.paymentSource === "driver"
            ? copy.paymentSource.hintDriverShort
            : undefined,
      }),
    },
    {
      id: "status",
      header: copy.table.status,
      kind: "status",
      className: "w-[9rem]",
      accessor: (expense) => {
        if (!showDetailMeta || !expense.status) return null;
        const financeHint = statusFinanceHint(expense.status);
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge
              variant={getExpenseStatusVariant(expense.status)}
              tone="soft"
              title={financeHint ?? undefined}
            >
              {statusBadgeLabel(expense.status)}
            </Badge>
            {showsSelfApprovedBadge({
              kind: "tripExpense",
              status: expense.status,
              selfSegregatedApproval: expense.selfSegregatedApproval,
            }) ? (
              <SelfApprovedBadge />
            ) : null}
            {!isReturnedExpense(expense) ? (
              <ApprovalFlowLines approval={expense.approval} />
            ) : null}
          </div>
        );
      },
    },
    {
      id: "amount",
      header: copy.table.amount,
      kind: "text",
      className: "w-[7.5rem] text-right font-semibold tabular-nums",
      accessor: (expense) => `−${formatMxCurrency(expense.amount)}`,
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      className: "w-[12rem]",
      headerClassName: "w-[12rem] text-right",
      accessor: (expense) => (
        <TripExpenseRowActions expense={expense} ctx={ctxForRow(expense)} />
      ),
    },
  ];
}

export function TripExpenseEditableList({
  items,
  emptyTitle,
  emptyDescription,
  footerLabel,
  footerTotal,
  onEdit,
  onRemove,
  onApprove,
  onReject,
  onReturn,
  onHistory,
  onCorrectReturned,
  canEditItem,
  canRemoveItem,
  canCorrectItem,
  getRowHint,
  getSelfActionUi,
  readOnly = false,
  showDetailMeta = false,
  actionsDisabled = false,
}: TripExpenseEditableListProps) {
  const ctxForRow = useMemo(() => {
    return (expense: TripExpenseListItem): RowActionCtx => {
      const canEdit =
        !readOnly &&
        onEdit != null &&
        (canEditItem ? canEditItem(expense) : true);
      const canRemove =
        !readOnly &&
        onRemove != null &&
        (canRemoveItem ? canRemoveItem(expense) : true);
      const canCorrect =
        onCorrectReturned != null &&
        isReturnedExpense(expense) &&
        (canCorrectItem ? canCorrectItem(expense) : canEdit);
      return {
        showDetailMeta,
        canEdit,
        canRemove,
        canCorrect,
        rowHint: getRowHint?.(expense) ?? null,
        actionsDisabled,
        onEdit,
        onRemove,
        onApprove,
        onReject,
        onReturn,
        onHistory,
        onCorrectReturned,
        selfActionUi: getSelfActionUi?.(expense) ?? "normal",
      };
    };
  }, [
    actionsDisabled,
    canCorrectItem,
    canEditItem,
    canRemoveItem,
    getRowHint,
    getSelfActionUi,
    onApprove,
    onCorrectReturned,
    onEdit,
    onHistory,
    onReject,
    onRemove,
    onReturn,
    readOnly,
    showDetailMeta,
  ]);

  const columns = useMemo(
    () => buildExpenseColumns(ctxForRow, showDetailMeta),
    [ctxForRow, showDetailMeta],
  );

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

  const showFooter =
    footerLabel != null && footerTotal != null && items.length > 0;

  return (
    <div className="space-y-2">
      <EntityListTable
        aria-label={copy.table.ariaLabel}
        columns={columns}
        rows={items}
        getRowId={(row) => row.id}
        density="compact"
        framed={false}
        footer={
          showFooter ? (
            <div className="flex items-center justify-between gap-3 text-sm font-medium text-foreground">
              <span>{footerLabel}</span>
              <span className="tabular-nums">{formatMxCurrency(footerTotal)}</span>
            </div>
          ) : undefined
        }
      />
      {items.some((item) => item.isEmptyReturn) ? (
        <p className="text-xs text-muted-foreground">{copy.emptyReturn.deleteHint}</p>
      ) : null}
      {items.map((item) => {
        const hint = getRowHint?.(item);
        return hint ? (
          <p key={`hint-${item.id}`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null;
      })}
    </div>
  );
}
