import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CircleDollarSign,
  Plus,
  Receipt,
  Undo2,
} from "lucide-react";

import { useQueryClient } from "@tanstack/react-query";
import {
  ApprovalHistorySheet,
  DecisionReasonSheet,
  ReturnedAlert,
  SelfApprovalConfirmDialog,
  approvalGuardsFor,
  approvalsCopy,
  buildApprovalsInboxPath,
  formatNextStepLabel,
  getApprovalGuardCode,
  guardErrorMessage,
  invalidateApprovalsRelatedQueries,
  isIntermediateStep,
  useSelfActionForbiddenHandler,
  useSelfActionResolver,
  type DecisionReasonInput,
  type DecisionReasonMode,
} from "@features/approvals";
import {
  useAddExpense,
  useApproveExpense,
  useDeleteExpense,
  useRejectExpense,
  useReturnExpense,
  useUpdateExpense,
} from "@features/trips/application/hooks/expense/useExpenseOperations";
import {
  TripStatus,
  tripQueryKeys,
  isExpenseNotMutableError,
  type CfdiEmissionIntent,
  type ExpensesSummary,
  type OperationalCashSummary,
  type TripExpense,
  type TripInvoiceStatus,
  type TripOperationalOutcomeType,
  type TripStop,
} from "@features/trips/domain";
import { useVehicle } from "@features/vehicles/application";
import { ROLES } from "@shared/constants/roles";
import { useToast } from "@shared/hooks";
import { usePermissions, useRole } from "@shared/permissions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailAlertCard } from "@shared/ui/data-display";
import { TripBaseRateCard } from "./TripBaseRateCard";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";

import { hasUnmarkedRouteFuel } from "../trip-financial/emptyReturnFuel";
import {
  getSheetKindForCategory,
  type TripExpenseSheetKind,
  formatMxCurrency,
  isIndirectExpenseCategory,
  isOperationalExpenseCategory,
  TripExpenseSheet,
  buildTripWizardFinancialSnapshot,
} from "../trip-financial";
import type { TripExpenseFormValues } from "../../pages/create/components/validation";
import { TripCostsCategoryBreakdown } from "./TripCostsCategoryBreakdown";
import { TripCostsFormulaStrip } from "./TripCostsFormulaStrip";
import { TripExpenseEditableList, type TripExpenseListItem } from "./TripExpenseEditableList";
import {
  formValuesToCreateExpenseInput,
  formValuesToUpdateExpenseInput,
  tripExpenseToFormValues,
  tripExpensesToListItems,
  tripExpensesToWizardLines,
} from "./tripExpenseFormBridge";
import { tripExpenseToRejectApprovableItem } from "./tripExpenseRejectApprovableItem";
import {
  canMutateTripExpenseRow,
  describeExpenseMutationError,
  isReturnedExpense,
} from "./tripExpenseMutability";
import { tripDetailCopy } from "../../copy";
import { pickCostsStatusBannerCopy } from "../../utils/pickCostsStatusBannerCopy";

const copy = tripDetailCopy.costs;

export interface TripDetailCostsTabProps {
  tripId: string;
  tripStatus: string;
  baseRate: number;
  /** Subtotal CFDI ingreso stamped vigentes; distinta de tarifa base. */
  facturadoVigente?: number | null;
  /** Cobranza aplicada a CFDI del viaje; distinta de tarifa base. */
  cobradoViaje?: number | null;
  cfdiDocumentIntent: "ingreso" | "traslado";
  /** ADR-0096 — liquidación sin CFDI + cobro operativo. */
  cfdiEmissionIntent?: CfdiEmissionIntent;
  operationalCashCollectedAt?: Date | null;
  operationalCashAmount?: number | null;
  operationalCashNote?: string | null;
  /** ADR-0096 addendum — resumen ledger (detail). */
  operationalCash?: OperationalCashSummary | null;
  clientId?: string;
  vehicleId?: string;
  stops: TripStop[];
  expenses: TripExpense[];
  expensesSummary?: ExpensesSummary;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  /** Tarifa base: solo draft/scheduled + permiso. */
  canEditBaseRate: boolean;
  /** Alta de gastos (pre-cierre o post-cierre en ventana). */
  canCreateExpenses: boolean;
  /** Gate de página para editar gastos; cada fila se evalúa además con su estado. */
  canUpdatePendingExpenses: boolean;
  /** Gate de página para eliminar gastos; cada fila se evalúa además con su estado. */
  canDeletePendingExpenses: boolean;
  /** TEC-5: corregir un gasto devuelto (sin ventana post-cierre). Default = pendientes. */
  canUpdateReturnedExpenses?: boolean;
  /** TEC-5: eliminar un gasto devuelto (sin ventana post-cierre). Default = pendientes. */
  canDeleteReturnedExpenses?: boolean;
  /** Instantánea de cierre (`trip.actualArrival`) para la ventana post-cierre por gasto. */
  tripClosedAt?: Date | string | null;
  /**
   * Compat / banners: alguna mutación habilitada.
   * @deprecated Prefer canCreateExpenses / canUpdatePendingExpenses.
   */
  canManageExpenses?: boolean;
  /** Viaje completed con ventana post-cierre abierta. */
  expenseWindowOpen?: boolean;
  /** Viaje completed con ventana cerrada. */
  expenseWindowClosed?: boolean;
  /** Límite de la ventana post-cierre. */
  expenseWindowClosesAt?: Date | null;
  /** Aprobar/rechazar gastos pendientes (roles con permiso de aprobaciones). */
  canApproveExpenses: boolean;
  pendingExpenseCount?: number;
  /** Código visible del viaje (para deep link a bandeja de aprobaciones). */
  tripCode?: string;
  /** PD7: vacío read-only tras declarar viaje en falso. */
  operationalOutcome?: TripOperationalOutcomeType;
  /** Estado de factura primaria (chip Facturado vs Tarifa en completed). */
  invoiceStatus?: TripInvoiceStatus | null;
}

function CostsTabSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

function CostsTabError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="space-y-4">
      <DetailAlertCard
        severity="critical"
        icon={<AlertCircle className="h-4 w-4" />}
        title={copy.alert.loadErrorTitle}
        items={[{ text: copy.alert.loadErrorBody }]}
      />
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        {copy.action.retry}
      </Button>
    </div>
  );
}

function formatWindowHint(
  template: string,
  closesAt: Date | null | undefined,
): string {
  const deadline =
    closesAt != null ? formatDateTime(closesAt.toISOString()) : "—";
  return template.replace("{deadline}", deadline);
}

type CostsStatusBanner = {
  severity: "info" | "warning" | "critical";
  icon: ReactNode;
  title: string;
  items: Array<{ text: ReactNode }>;
};

/**
 * Un solo banner priorizado (D5):
 * pendientes > ventana abierta > ventana cerrada > en curso > margen bajo.
 */
function resolveCostsStatusBanner(input: {
  isOperator: boolean;
  pendingExpenseCount: number;
  pendingExpenseAmountLabel: string;
  canApproveExpenses: boolean;
  canViewApprovalsHub: boolean;
  approvalsHubPath: string;
  expenseWindowOpen: boolean;
  expenseWindowClosed: boolean;
  expenseWindowClosesAt: Date | null;
  tripStatus: string;
  manageHint: boolean;
  marginCritical: boolean;
  returnedExpenseCount: number;
  canCorrectReturned: boolean;
}): CostsStatusBanner | null {
  const {
    pendingExpenseCount,
    canApproveExpenses,
    canViewApprovalsHub,
    approvalsHubPath,
    expenseWindowOpen,
    expenseWindowClosed,
    expenseWindowClosesAt,
    tripStatus,
    manageHint,
    marginCritical,
  } = input;

  const picked = pickCostsStatusBannerCopy({
    isOperator: input.isOperator,
    pendingExpenseCount,
    pendingExpenseAmountLabel: input.pendingExpenseAmountLabel,
    canApproveExpenses,
    expenseWindowOpen,
    expenseWindowClosed,
    tripStatus,
    manageHint,
    marginCritical,
    returnedExpenseCount: input.returnedExpenseCount,
    canCorrectReturned: input.canCorrectReturned,
  });
  if (!picked) return null;

  if (picked.kind === "returned") {
    return {
      severity: "warning",
      icon: <Undo2 className="h-4 w-4" />,
      title: picked.title,
      items: [{ text: picked.body }],
    };
  }

  if (picked.kind === "pending") {
    return {
      severity: "warning",
      icon: <Receipt className="h-4 w-4" />,
      title: picked.title,
      items: [
        { text: picked.body },
        ...(canViewApprovalsHub
          ? [
              {
                text: (
                  <Link
                    to={approvalsHubPath}
                    className="font-medium text-primary hover:underline"
                  >
                    {copy.alert.approvalsHubLink}
                  </Link>
                ),
              },
            ]
          : []),
      ],
    };
  }

  const needsDeadline =
    picked.kind === "postCloseOpen" || picked.kind === "postCloseClosed";

  return {
    severity: picked.kind === "marginCritical" ? "critical" : "info",
    icon:
      picked.kind === "marginCritical" ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <CircleDollarSign className="h-4 w-4" />
      ),
    title: picked.title,
    items: [
      {
        text: needsDeadline
          ? formatWindowHint(picked.body, expenseWindowClosesAt)
          : picked.body,
      },
    ],
  };
}

export function TripDetailCostsTab({
  tripId,
  tripStatus,
  baseRate,
  facturadoVigente: _facturadoVigente = null,
  cobradoViaje: _cobradoViaje = null,
  cfdiDocumentIntent,
  cfdiEmissionIntent,
  clientId,
  vehicleId,
  stops,
  expenses,
  expensesSummary,
  isLoading,
  isError,
  onRetry,
  canEditBaseRate,
  canCreateExpenses,
  canUpdatePendingExpenses,
  canDeletePendingExpenses,
  canUpdateReturnedExpenses = canUpdatePendingExpenses,
  canDeleteReturnedExpenses = canDeletePendingExpenses,
  tripClosedAt = null,
  canManageExpenses,
  expenseWindowOpen = false,
  expenseWindowClosed = false,
  expenseWindowClosesAt = null,
  canApproveExpenses,
  pendingExpenseCount = 0,
  tripCode,
  operationalOutcome,
  invoiceStatus = null,
}: TripDetailCostsTabProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const role = useRole();
  const isOperator = role === ROLES.OPERATOR;
  const canViewApprovalsHub = hasPermission("finance_approvals", "read");
  const isSinCfdiEfectivo = cfdiEmissionIntent === "sin_cfdi_efectivo";
  const [searchParams, setSearchParams] = useSearchParams();
  /** D15 / Q11: cobro vive en tab Cobro; deep-link legado → billing. */
  useEffect(() => {
    if (!isSinCfdiEfectivo) return;
    if (searchParams.get("focus") !== "operational-cash") return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("focus");
        next.set("tab", "billing");
        return next;
      },
      { replace: true },
    );
  }, [isSinCfdiEfectivo, searchParams, setSearchParams]);
  const approvalsHubPath = useMemo(
    () =>
      buildApprovalsInboxPath({
        type: "trip_expense",
        status: "pending",
        tripId,
        tripCode: tripCode || undefined,
      }),
    [tripCode, tripId],
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKind, setSheetKind] = useState<TripExpenseSheetKind>("cost");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [initialExpense, setInitialExpense] = useState<TripExpenseFormValues | null>(
    null,
  );
  const queryClient = useQueryClient();
  const [reasonSheet, setReasonSheet] = useState<{
    mode: DecisionReasonMode;
    expense: TripExpense;
  } | null>(null);
  const [reasonSheetOpen, setReasonSheetOpen] = useState(false);
  const [historyExpense, setHistoryExpense] = useState<TripExpense | null>(null);
  const [stepConfirmExpenseId, setStepConfirmExpenseId] = useState<string | null>(null);
  const [selfApproveExpenseId, setSelfApproveExpenseId] = useState<string | null>(
    null,
  );
  const resolveExpenseSelfActionUi = useSelfActionResolver("tripExpenseApprove");
  const handleSelfActionForbidden = useSelfActionForbiddenHandler();
  const getExpenseSelfActionUi = (item: TripExpenseListItem) =>
    resolveExpenseSelfActionUi([item.createdBy]);
  const describeExpenseActionError = (error: unknown): string | undefined => {
    const forbidden = handleSelfActionForbidden(error);
    if (forbidden) {
      return forbidden.message ?? approvalsCopy.selfApproval.serverRejected;
    }
    return error instanceof Error ? error.message : undefined;
  };

  const { data: vehicle } = useVehicle(vehicleId ?? "");
  const expectedFuelEfficiency =
    vehicle?.capacities?.expectedFuelEfficiency ?? null;

  const totalDistanceKm = useMemo(() => {
    if (!stops || stops.length < 2) return 0;
    return stops.reduce(
      (sum, stop, index) =>
        index > 0 ? sum + (stop.distanceFromPreviousKm || 0) : sum,
      0,
    );
  }, [stops]);

  const addExpense = useAddExpense(tripId);
  const updateExpense = useUpdateExpense(tripId);
  const deleteExpense = useDeleteExpense(tripId);
  const approveExpense = useApproveExpense(tripId);
  const rejectExpense = useRejectExpense(tripId);
  const returnExpense = useReturnExpense(tripId);

  const isDeciding = rejectExpense.isPending || returnExpense.isPending;
  const isExpenseMutating =
    addExpense.isPending ||
    updateExpense.isPending ||
    deleteExpense.isPending ||
    approveExpense.isPending ||
    isDeciding;

  const expenseLines = useMemo(() => tripExpensesToWizardLines(expenses), [expenses]);
  const unmarkedRouteFuel = useMemo(
    () => hasUnmarkedRouteFuel(expenses),
    [expenses],
  );

  const operationalItems = useMemo(
    () =>
      expenses.filter((expense) =>
        isOperationalExpenseCategory(expense.category),
      ),
    [expenses],
  );
  const indirectItems = useMemo(
    () =>
      expenses.filter((expense) => isIndirectExpenseCategory(expense.category)),
    [expenses],
  );

  const operationalListItems = useMemo(
    () => tripExpensesToListItems(operationalItems),
    [operationalItems],
  );
  const indirectListItems = useMemo(
    () => tripExpensesToListItems(indirectItems),
    [indirectItems],
  );

  const isCompleted = tripStatus === TripStatus.COMPLETED;
  const financialSnapshot = useMemo(
    () =>
      buildTripWizardFinancialSnapshot(baseRate, expenseLines, {
        // PD-D: en completed el margen primario = solo approved (paridad Finanzas).
        costBasis: isCompleted ? "approved" : "all",
      }),
    [baseRate, expenseLines, isCompleted],
  );

  const incomeSourceLabel = useMemo(() => {
    if (!isCompleted) return null;
    const invoiced =
      invoiceStatus === "stamped" || invoiceStatus === "cancellation_pending";
    return invoiced
      ? copy.incomeSource.invoiced
      : copy.incomeSource.rateRegistered;
  }, [invoiceStatus, isCompleted]);

  const operationalListTotal = useMemo(
    () => operationalItems.reduce((sum, item) => sum + item.amount, 0),
    [operationalItems],
  );
  const indirectListTotal = useMemo(
    () => indirectItems.reduce((sum, item) => sum + item.amount, 0),
    [indirectItems],
  );
  const pendingExpenseAmount = useMemo(
    () =>
      expenses
        .filter((item) => item.status === "pending" || item.status === "documented")
        .reduce((sum, item) => sum + item.amount, 0),
    [expenses],
  );

  const categoryEntries = useMemo(() => {
    if (expensesSummary && Object.keys(expensesSummary.byCategory).length > 0) {
      return Object.entries(expensesSummary.byCategory)
        .filter(([, amount]) => amount > 0)
        .sort((a, b) => b[1] - a[1]) as [string, number][];
    }
    const byCategory = new Map<string, number>();
    for (const expense of expenses) {
      byCategory.set(
        expense.category,
        (byCategory.get(expense.category) ?? 0) + expense.amount,
      );
    }
    return [...byCategory.entries()]
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]) as [string, number][];
  }, [expenses, expensesSummary]);

  const showAddButtons = canCreateExpenses;
  const showExpenseSheet = canCreateExpenses || canUpdatePendingExpenses || canUpdateReturnedExpenses;
  const listReadOnly =
    !canUpdatePendingExpenses &&
    !canDeletePendingExpenses &&
    !canUpdateReturnedExpenses &&
    !canDeleteReturnedExpenses &&
    !canCreateExpenses;
  const emptyEditable = canCreateExpenses;
  const emptyReadOnlyDescription =
    operationalOutcome === "false_trip"
      ? copy.state.emptyAfterFalseTrip
      : expenseWindowClosed
        ? formatWindowHint(copy.hint.postCloseWindowClosed, expenseWindowClosesAt)
        : undefined;
  const baseRateReadOnly = !canEditBaseRate;

  const rowGates = (item: Pick<TripExpenseListItem, "approval">) =>
    isReturnedExpense(item)
      ? { update: canUpdateReturnedExpenses, remove: canDeleteReturnedExpenses }
      : { update: canUpdatePendingExpenses, remove: canDeletePendingExpenses };
  const canEditItem = (item: Pick<TripExpenseListItem, "status" | "approval">) =>
    canMutateTripExpenseRow({
      gate: rowGates(item).update,
      tripStatus,
      expenseStatus: item.status,
      closedAt: tripClosedAt,
      returnedForCorrection: isReturnedExpense(item),
    });
  const canRemoveItem = (item: Pick<TripExpenseListItem, "status" | "approval">) =>
    canMutateTripExpenseRow({
      gate: rowGates(item).remove,
      tripStatus,
      expenseStatus: item.status,
      closedAt: tripClosedAt,
      returnedForCorrection: isReturnedExpense(item),
    });
  const canEditAnyExpense = canUpdatePendingExpenses || canUpdateReturnedExpenses;
  const canDeleteAnyExpense = canDeletePendingExpenses || canDeleteReturnedExpenses;
  const windowClosedDate = expenseWindowClosesAt
    ? formatDate(expenseWindowClosesAt.toISOString())
    : null;
  /** TEC-5: la pista de ventana cerrada solo aplica a gastos sin decidir y no devueltos. */
  const getRowHint = (item: TripExpenseListItem): string | null => {
    if (!expenseWindowClosed || !windowClosedDate || !canUpdateReturnedExpenses) return null;
    if (isReturnedExpense(item)) return null;
    if (item.status !== "pending" && item.status !== "documented") return null;
    return copy.state.windowClosedRow(windowClosedDate);
  };

  const editingExpense = editingExpenseId
    ? (expenses.find((item) => item.id === editingExpenseId) ?? null)
    : null;
  const isCorrectingReturned = editingExpense != null && isReturnedExpense(editingExpense);

  const closeExpenseSheet = () => {
    setSheetOpen(false);
    setEditingExpenseId(null);
    setInitialExpense(null);
  };

  /** Handoff F6 §6: una guarda avisa y recarga; nunca se reintenta. */
  const handleGuardError = (error: unknown, close: () => void): boolean => {
    const guard = getApprovalGuardCode(error);
    if (!guard) return false;
    close();
    void queryClient.invalidateQueries({ queryKey: tripQueryKeys.expenses(tripId) });
    void queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) });
    invalidateApprovalsRelatedQueries(queryClient);
    toast({ title: guardErrorMessage(guard), variant: "warning" });
    return true;
  };

  const runApproveExpense = async (expenseId: string) => {
    const expense = expenses.find((item) => item.id === expenseId);
    const step =
      expense && isIntermediateStep(expense.approval)
        ? {
            current: expense.approval.stepCurrent,
            total: expense.approval.stepsTotal,
            nextRole: formatNextStepLabel(expense.approval),
          }
        : null;
    try {
      const result = await approveExpense.mutateAsync({
        expenseId,
        guards: expense ? approvalGuardsFor(expense) : undefined,
      });
      const title =
        result?.approvalOutcome === "step_signed" && step
          ? approvalsCopy.flow.stepSignedToast(step.current, step.total, step.nextRole)
          : copy.toast.approved;
      toast({ title, variant: "success" });
    } catch (error) {
      if (handleGuardError(error, () => setStepConfirmExpenseId(null))) return;
      toast({
        title: copy.toast.approveError,
        description: describeExpenseActionError(error),
        variant: "error",
      });
    }
  };

  const openReasonSheet = (mode: DecisionReasonMode, expenseId: string) => {
    const expense = expenses.find((item) => item.id === expenseId);
    if (!expense) return;
    setReasonSheet({ mode, expense });
    setReasonSheetOpen(true);
  };

  const approveHandlers = canApproveExpenses
    ? {
        onApprove: async (expenseId: string) => {
          const listItem = [...operationalListItems, ...indirectListItems].find(
            (item) => item.id === expenseId,
          );
          if (listItem && getExpenseSelfActionUi(listItem) === "self_confirm") {
            setSelfApproveExpenseId(expenseId);
            return;
          }
          if (listItem && isIntermediateStep(listItem.approval)) {
            setStepConfirmExpenseId(expenseId);
            return;
          }
          await runApproveExpense(expenseId);
        },
        onReject: (expenseId: string) => openReasonSheet("reject", expenseId),
        onReturn: (expenseId: string) => openReasonSheet("return", expenseId),
      }
    : { onApprove: undefined, onReject: undefined, onReturn: undefined };

  const handleHistory = canViewApprovalsHub
    ? (expenseId: string) => {
        const expense = expenses.find((item) => item.id === expenseId);
        if (expense) setHistoryExpense(expense);
      }
    : undefined;

  const reasonApprovableItem = useMemo(
    () =>
      reasonSheet
        ? tripExpenseToRejectApprovableItem(reasonSheet.expense, tripId, tripCode)
        : null,
    [reasonSheet, tripCode, tripId],
  );

  const closeReasonSheet = () => {
    setReasonSheetOpen(false);
    setReasonSheet(null);
  };

  const handleReasonSubmit = async (input: DecisionReasonInput) => {
    if (!reasonSheet) return;
    const { mode, expense } = reasonSheet;
    const guards = approvalGuardsFor(expense);
    try {
      if (mode === "return") {
        await returnExpense.mutateAsync({
          expenseId: expense.id,
          reason: input.reason,
          reasonCode: input.reasonCode ?? "other",
          guards,
        });
        toast({ title: approvalsCopy.flow.returnSuccess("trip_expense"), variant: "success" });
      } else {
        await rejectExpense.mutateAsync({
          expenseId: expense.id,
          reason: input.reason,
          guards,
        });
        toast({ title: copy.toast.rejected, variant: "success" });
      }
      closeReasonSheet();
    } catch (error) {
      if (handleGuardError(error, closeReasonSheet)) return;
      toast({
        title: mode === "return" ? approvalsCopy.flow.returnError : copy.toast.rejectError,
        description: describeExpenseActionError(error),
        variant: "error",
      });
    }
  };

  const handleOpenAdd = (kind: TripExpenseSheetKind) => {
    setSheetKind(kind);
    setEditingExpenseId(null);
    setInitialExpense(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (expenseId: string) => {
    const expense = expenses.find((item) => item.id === expenseId);
    if (!expense || !canEditItem(expense)) return;
    setSheetKind(getSheetKindForCategory(expense.category));
    setEditingExpenseId(expenseId);
    setInitialExpense(tripExpenseToFormValues(expense));
    setSheetOpen(true);
  };

  const handleRemove = async (expenseId: string) => {
    const expense = expenses.find((item) => item.id === expenseId);
    if (!expense || !canRemoveItem(expense)) return;
    try {
      await deleteExpense.mutateAsync(expenseId);
      toast({ title: copy.toast.removed, variant: "success" });
    } catch (error) {
      toast({
        title: copy.toast.removeError,
        description: describeExpenseMutationError(error, "remove"),
        variant: "error",
      });
    }
  };

  // Sheet pasa editingIndex (wizard); el detalle usa editingExpenseId.
  const handleSubmitFromSheet = async (
    values: TripExpenseFormValues,
    _editingIndex: number | null,
    options?: { keepOpen?: boolean; companion?: TripExpenseFormValues },
  ): Promise<boolean> => {
    void _editingIndex;
    try {
      if (editingExpenseId) {
        await updateExpense.mutateAsync({
          expenseId: editingExpenseId,
          data: formValuesToUpdateExpenseInput(values),
        });
        if (!options?.keepOpen) {
          toast({
            title: isCorrectingReturned ? copy.toast.resubmitted : copy.toast.updated,
            variant: "success",
          });
          closeExpenseSheet();
        }
        return true;
      }

      const companion = options?.companion;
      await addExpense.mutateAsync(formValuesToCreateExpenseInput(values));
      if (companion) {
        try {
          await addExpense.mutateAsync(formValuesToCreateExpenseInput(companion));
        } catch {
          toast({
            title: copy.toast.saveError,
            description: copy.toast.createdRoutePendingReturn,
            variant: "error",
          });
          closeExpenseSheet();
          return false;
        }
      }

      if (!options?.keepOpen) {
        toast({
          title: companion
            ? copy.toast.createdPair(values.description, companion.description)
            : copy.toast.created,
          variant: "success",
        });
        closeExpenseSheet();
      }
      return true;
    } catch (error) {
      if (editingExpenseId != null && handleGuardError(error, closeExpenseSheet)) return false;
      const notMutable = editingExpenseId != null && isExpenseNotMutableError(error);
      toast({
        title: copy.toast.saveError,
        description: describeExpenseMutationError(error, "edit"),
        variant: "error",
      });
      if (notMutable) closeExpenseSheet();
      return false;
    }
  };

  if (isLoading) {
    return <CostsTabSkeleton />;
  }

  if (isError) {
    return <CostsTabError onRetry={onRetry} />;
  }

  const { financial } = financialSnapshot;
  const manageHint =
    canManageExpenses ??
    (canCreateExpenses || canUpdatePendingExpenses || canDeletePendingExpenses);
  const marginCritical = financial.health === "critical" && baseRate > 0;
  const statusBanner = resolveCostsStatusBanner({
    isOperator,
    pendingExpenseCount,
    pendingExpenseAmountLabel: formatMxCurrency(pendingExpenseAmount),
    canApproveExpenses,
    canViewApprovalsHub,
    approvalsHubPath,
    expenseWindowOpen,
    expenseWindowClosed,
    expenseWindowClosesAt,
    tripStatus,
    manageHint,
    marginCritical,
    returnedExpenseCount: expenses.filter(isReturnedExpense).length,
    canCorrectReturned: canUpdateReturnedExpenses,
  });

  const listActionProps = {
    canEditItem,
    canRemoveItem,
    canCorrectItem: canEditItem,
    getRowHint,
    onEdit: canEditAnyExpense ? handleOpenEdit : undefined,
    onRemove: canDeleteAnyExpense ? handleRemove : undefined,
    onCorrectReturned: canUpdateReturnedExpenses ? handleOpenEdit : undefined,
    onApprove: approveHandlers.onApprove,
    onReject: approveHandlers.onReject,
    onReturn: approveHandlers.onReturn,
    onHistory: handleHistory,
    getSelfActionUi: getExpenseSelfActionUi,
    actionsDisabled: isExpenseMutating,
  };

  return (
    <div className="space-y-6" data-costs-layout="operate-costos">
      <TripCostsFormulaStrip
        income={financial.baseRate}
        incomeHint={
          incomeSourceLabel ?? copy.financialSummary.label.baseRate
        }
        operationalTotal={financial.totalOperationalCosts}
        operationalCount={
          isCompleted
            ? financialSnapshot.operationalCosts.length
            : operationalItems.length
        }
        indirectTotal={financial.totalIndirectExpenses}
        indirectCount={
          isCompleted
            ? financialSnapshot.indirectExpenses.length
            : indirectItems.length
        }
        utility={financial.margin}
        marginPct={financial.marginPct}
        confirmed={isCompleted}
      />

      {statusBanner ? (
        <DetailAlertCard
          severity={statusBanner.severity}
          icon={statusBanner.icon}
          title={statusBanner.title}
          items={statusBanner.items}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-base">
                  {copy.section.operational}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {copy.sectionDescription.operational}
                </p>
              </div>
              {showAddButtons ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isExpenseMutating}
                  onClick={() => handleOpenAdd("cost")}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {copy.action.addCost}
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              <TripExpenseEditableList
                items={operationalListItems}
                showDetailMeta
                readOnly={listReadOnly}
                footerLabel={copy.footer.operational}
                footerTotal={operationalListTotal}
                emptyTitle={copy.state.emptyOperationalTitle}
                emptyDescription={
                  emptyEditable
                    ? copy.state.emptyOperationalEditable
                    : (emptyReadOnlyDescription ??
                      copy.state.emptyOperationalReadOnly)
                }
                {...listActionProps}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-base">
                  {copy.section.indirect}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {copy.hint.indirectChannels}
                </p>
              </div>
              {showAddButtons ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isExpenseMutating}
                  onClick={() => handleOpenAdd("expense")}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {copy.action.addExpense}
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              <TripExpenseEditableList
                items={indirectListItems}
                showDetailMeta
                readOnly={listReadOnly}
                footerLabel={copy.footer.indirect}
                footerTotal={indirectListTotal}
                emptyTitle={copy.state.emptyIndirectTitle}
                emptyDescription={
                  emptyEditable
                    ? copy.state.emptyIndirectEditable
                    : (emptyReadOnlyDescription ??
                      copy.state.emptyIndirectReadOnly)
                }
                {...listActionProps}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24">
          <TripBaseRateCard
            tripId={tripId}
            baseRate={baseRate}
            cfdiDocumentIntent={cfdiDocumentIntent}
            clientId={clientId}
            expenseLines={expenseLines}
            readOnly={baseRateReadOnly}
            incomeSourceLabel={incomeSourceLabel}
          />
          <TripCostsCategoryBreakdown entries={categoryEntries} />
        </div>
      </div>

      {showExpenseSheet ? (
        <TripExpenseSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          expenseKind={sheetKind}
          initialValues={initialExpense}
          editingIndex={editingExpenseId ? 0 : null}
          totalDistanceKm={totalDistanceKm}
          expectedFuelEfficiency={expectedFuelEfficiency}
          hasUnmarkedRouteFuel={unmarkedRouteFuel}
          isSubmitting={isExpenseMutating}
          onSubmit={handleSubmitFromSheet}
          notice={
            isCorrectingReturned ? <ReturnedAlert approval={editingExpense?.approval} /> : null
          }
          submitLabel={isCorrectingReturned ? copy.action.saveAndResubmit : undefined}
        />
      ) : null}

      {canApproveExpenses ? (
        <DecisionReasonSheet
          mode={reasonSheet?.mode ?? "reject"}
          open={reasonSheetOpen}
          onOpenChange={(open) => {
            if (!open && isDeciding) return;
            if (!open) closeReasonSheet();
            else setReasonSheetOpen(true);
          }}
          item={reasonApprovableItem}
          isSubmitting={isDeciding}
          type="trip_expense"
          onSubmit={(input) => {
            void handleReasonSubmit(input);
          }}
        />
      ) : null}

      {canApproveExpenses ? (
        <AlertDialog
          open={stepConfirmExpenseId != null}
          onOpenChange={(open) => {
            if (!open && !approveExpense.isPending) setStepConfirmExpenseId(null);
          }}
        >
          <AlertDialogContent>
            {(() => {
              const target = expenses.find((item) => item.id === stepConfirmExpenseId);
              const approval = target?.approval;
              const current = approval?.stepCurrent ?? 1;
              const total = approval?.stepsTotal ?? 2;
              return (
                <>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {approvalsCopy.flow.stepConfirmTitle(current, total)}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {approvalsCopy.flow.stepConfirmBody(current, total)}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={approveExpense.isPending}>
                      {copy.action.cancel}
                    </AlertDialogCancel>
                    <Button
                      type="button"
                      disabled={approveExpense.isPending}
                      onClick={() => {
                        const expenseId = stepConfirmExpenseId;
                        if (!expenseId) return;
                        void runApproveExpense(expenseId).finally(() =>
                          setStepConfirmExpenseId(null),
                        );
                      }}
                    >
                      {approvalsCopy.flow.stepConfirmAction}
                    </Button>
                  </AlertDialogFooter>
                </>
              );
            })()}
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      {canViewApprovalsHub ? (
        <ApprovalHistorySheet
          open={historyExpense != null}
          onOpenChange={(open) => {
            if (!open) setHistoryExpense(null);
          }}
          type="trip_expense"
          id={historyExpense?.id ?? null}
          subtitle={historyExpense?.description}
        />
      ) : null}

      {canApproveExpenses ? (
        <SelfApprovalConfirmDialog
          open={selfApproveExpenseId != null}
          onOpenChange={(open) => {
            if (!open) setSelfApproveExpenseId(null);
          }}
          subject="expense"
          isPending={approveExpense.isPending}
          onConfirm={() => {
            const expenseId = selfApproveExpenseId;
            setSelfApproveExpenseId(null);
            if (expenseId) void runApproveExpense(expenseId);
          }}
        />
      ) : null}

    </div>
  );
}
