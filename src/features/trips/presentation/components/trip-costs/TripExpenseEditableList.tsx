import { memo } from "react";
import { Check, Edit2, MoreHorizontal, Receipt, Trash2 } from "lucide-react";

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
}

export interface TripExpenseEditableListProps {
  items: TripExpenseListItem[];
  emptyTitle: string;
  emptyDescription: string;
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

const TripExpenseEditableListItem = memo(function TripExpenseEditableListItem({
  expense,
  showDetailMeta,
  canEdit,
  canRemove,
  canCorrect,
  rowHint,
  onEdit,
  onRemove,
  onApprove,
  onReject,
  onReturn,
  onHistory,
  onCorrectReturned,
  actionsDisabled = false,
  selfActionUi = "normal",
}: {
  expense: TripExpenseListItem;
  showDetailMeta: boolean;
  canEdit: boolean;
  canRemove: boolean;
  canCorrect: boolean;
  rowHint: string | null;
  actionsDisabled?: boolean;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onReturn?: (id: string) => void;
  onHistory?: (id: string) => void;
  onCorrectReturned?: (id: string) => void;
  selfActionUi?: SelfActionUi;
}) {
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

  const category = EXPENSE_CATEGORY_MAP.get(
    expense.category as TripExpenseFormValues["category"],
  );
  const financeHint =
    showDetailMeta && expense.status
      ? statusFinanceHint(expense.status)
      : null;

  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
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
            {expense.paymentSource === "company" ? (
              <Badge variant="secondary" className="text-xs font-normal">
                {copy.paymentSource.badgeCompany}
              </Badge>
            ) : null}
            {expense.paymentSource === "advance" ? (
              <Badge variant="secondary" className="text-xs font-normal">
                {copy.paymentSource.badgeAdvance}
              </Badge>
            ) : null}
            {showDetailMeta &&
            showsSelfApprovedBadge({
              kind: "tripExpense",
              status: expense.status,
              selfSegregatedApproval: expense.selfSegregatedApproval,
            }) ? (
              <SelfApprovedBadge />
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
          {showDetailMeta && !returned ? (
            <ApprovalFlowLines approval={expense.approval} />
          ) : null}
          {rowHint ? (
            <p className="mt-1 text-xs text-muted-foreground">{rowHint}</p>
          ) : null}
        </div>
        <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
          -{formatMxCurrency(expense.amount)}
        </span>
        <div className="flex shrink-0 items-start gap-1">
          {showStateChip ? <ApprovalActionStateChip actionUi={actionUi} /> : null}
          {canAct ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-success hover:text-success"
              disabled={actionsDisabled}
              onClick={() => onApprove?.(expense.id)}
              aria-label={copy.action.approve}
              title={copy.action.approve}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          {showEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
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
              className="h-7 w-7 text-destructive hover:text-destructive"
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
                  size="icon"
                  className="h-7 w-7"
                  disabled={actionsDisabled}
                  aria-label={copy.action.more}
                  title={copy.action.more}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {openReturn ? (
                  <DropdownMenuItem onSelect={openReturn}>
                    {approvalsCopy.flow.menu.return}
                  </DropdownMenuItem>
                ) : null}
                {openReject ? (
                  <DropdownMenuItem
                    onSelect={openReject}
                    className="text-destructive focus:text-destructive"
                  >
                    {copy.action.reject}
                  </DropdownMenuItem>
                ) : null}
                {(openReturn || openReject) && openHistory ? (
                  <DropdownMenuSeparator />
                ) : null}
                {openHistory ? (
                  <DropdownMenuItem onSelect={openHistory}>
                    {approvalsCopy.flow.menu.history}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
      {returned ? (
        <ReturnedAlert
          className="mt-2"
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

export function TripExpenseEditableList({
  items,
  emptyTitle,
  emptyDescription,
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
        const canCorrect =
          onCorrectReturned != null &&
          isReturnedExpense(expense) &&
          (canCorrectItem ? canCorrectItem(expense) : canEdit);
        return (
          <TripExpenseEditableListItem
            key={expense.id}
            expense={expense}
            showDetailMeta={showDetailMeta}
            canEdit={canEdit}
            canRemove={canRemove}
            canCorrect={canCorrect}
            rowHint={getRowHint?.(expense) ?? null}
            actionsDisabled={actionsDisabled}
            onEdit={onEdit}
            onRemove={onRemove}
            onApprove={onApprove}
            onReject={onReject}
            onReturn={onReturn}
            onHistory={onHistory}
            onCorrectReturned={onCorrectReturned}
            selfActionUi={getSelfActionUi?.(expense)}
          />
        );
      })}
    </div>
  );
}
