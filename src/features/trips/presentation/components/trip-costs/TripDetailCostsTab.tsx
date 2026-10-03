import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Banknote,
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
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailAlertCard, InfoRow } from "@shared/ui/data-display";
import { TripBaseRateCard } from "./TripBaseRateCard";
import { RegisterOperationalCashSheet } from "./RegisterOperationalCashSheet";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";

import {
  getSheetKindForCategory,
  type TripExpenseSheetKind,
  formatMxCurrency,
  isIndirectExpenseCategory,
  isOperationalExpenseCategory,
  TripExpenseSheet,
  TripWizardFinancialSummary,
  buildTripWizardFinancialSnapshot,
} from "../trip-financial";
import type { TripExpenseFormValues } from "../../pages/create/components/validation";
import { TripCostsCategoryBreakdown } from "./TripCostsCategoryBreakdown";
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
import { cfdiEmissionIntentCopy } from "../../copy/cfdiEmissionIntentCopy";
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
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
  facturadoVigente = null,
  cobradoViaje = null,
  cfdiDocumentIntent,
  cfdiEmissionIntent,
  operationalCashCollectedAt = null,
  operationalCashAmount = null,
  operationalCashNote = null,
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
  const canRegisterOperationalCash = hasPermission("trips", "update");
  const isSinCfdiEfectivo = cfdiEmissionIntent === "sin_cfdi_efectivo";
  const cashCollected = operationalCashCollectedAt != null;
  const cashCopy = cfdiEmissionIntentCopy.cash;
  const [cashSheetOpen, setCashSheetOpen] = useState(false);
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

  const calculationStatusHint = isCompleted
    ? copy.financialSummary.hint.calculationApprovedOnly
    : copy.financialSummary.hint.calculationEstimated;

  const queuedCostsHint =
    isCompleted && financialSnapshot.queuedCostsTotal > 0
      ? copy.financialSummary.hint.queuedMayLower(
          formatMxCurrency(financialSnapshot.queuedCostsTotal),
        )
      : null;

  const categoryEntries = useMemo(() => {
    if (expensesSummary && Object.keys(expensesSummary.byCategory).length > 0) {
      return Object.entries(expensesSummary.byCategory) as [string, number][];
    }
    return null;
  }, [expensesSummary]);

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

  const handleSubmitFromSheet = async (
    values: TripExpenseFormValues,
    _editingIndex: number | null,
    options?: { keepOpen?: boolean },
  ) => {
    try {
      if (editingExpenseId) {
        await updateExpense.mutateAsync({
          expenseId: editingExpenseId,
          data: formValuesToUpdateExpenseInput(values),
        });
        toast({
          title: isCorrectingReturned ? copy.toast.resubmitted : copy.toast.updated,
          variant: "success",
        });
      } else {
        await addExpense.mutateAsync(formValuesToCreateExpenseInput(values));
        toast({ title: copy.toast.created, variant: "success" });
      }
      if (!options?.keepOpen) {
        closeExpenseSheet();
      }
    } catch (error) {
      if (editingExpenseId != null && handleGuardError(error, closeExpenseSheet)) return;
      const notMutable = editingExpenseId != null && isExpenseNotMutableError(error);
      toast({
        title: copy.toast.saveError,
        description: describeExpenseMutationError(error, "edit"),
        variant: "error",
      });
      if (notMutable) closeExpenseSheet();
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
    <div className="space-y-6">
      {statusBanner ? (
        <DetailAlertCard
          severity={statusBanner.severity}
          icon={statusBanner.icon}
          title={statusBanner.title}
          items={statusBanner.items}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <TripBaseRateCard
            tripId={tripId}
            baseRate={baseRate}
            cfdiDocumentIntent={cfdiDocumentIntent}
            clientId={clientId}
            expenseLines={expenseLines}
            readOnly={baseRateReadOnly}
            incomeSourceLabel={incomeSourceLabel}
          />

          {isSinCfdiEfectivo ? (
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
                <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                  <Banknote className="h-5 w-5 shrink-0" />
                  {cashCopy.sectionTitle}
                  <Badge
                    variant={cashCollected ? "success" : "neutral"}
                    tone="soft"
                    className="text-xs font-medium"
                  >
                    {cashCollected
                      ? cashCopy.statusCollected
                      : cashCopy.statusPending}
                  </Badge>
                </CardTitle>
                {!cashCollected && canRegisterOperationalCash ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCashSheetOpen(true)}
                  >
                    {cashCopy.ctaRegister}
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-2">
                {cashCollected ? (
                  <>
                    <InfoRow
                      variant="inline"
                      label={cashCopy.scorecardLabel}
                      value={formatMxCurrency(operationalCashAmount ?? 0)}
                    />
                    {operationalCashCollectedAt ? (
                      <InfoRow
                        variant="inline"
                        label={cashCopy.sheet.collectedAt}
                        value={formatDateTime(
                          operationalCashCollectedAt.toISOString(),
                        )}
                      />
                    ) : null}
                    {operationalCashNote ? (
                      <p className="text-sm text-muted-foreground">
                        {operationalCashNote}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {cfdiEmissionIntentCopy.banner}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CircleDollarSign className="h-5 w-5 shrink-0" />
                {copy.section.operational}
              </CardTitle>
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
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="h-5 w-5 shrink-0" />
                  {copy.section.indirect}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{copy.hint.indirectChannels}</p>
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
          <TripWizardFinancialSummary
            className="h-fit"
            snapshot={financialSnapshot}
            variant="totals"
            summaryCopy={copy.financialSummary}
            facturadoVigente={isSinCfdiEfectivo ? null : facturadoVigente}
            cobradoViaje={isSinCfdiEfectivo ? null : cobradoViaje}
            operationalCashAmount={
              isSinCfdiEfectivo ? (operationalCashAmount ?? null) : null
            }
            showOperationalCash={isSinCfdiEfectivo}
            title={
              isCompleted
                ? copy.financialSummary.section.title
                : copy.financialSummary.section.titleEstimated
            }
            incomeSourceLabel={isSinCfdiEfectivo ? null : incomeSourceLabel}
            calculationStatusHint={calculationStatusHint}
            queuedCostsHint={queuedCostsHint}
            marginLabel={
              isCompleted
                ? copy.financialSummary.label.marginConfirmed
                : undefined
            }
          />
          {categoryEntries ? (
            <TripCostsCategoryBreakdown entries={categoryEntries} />
          ) : null}
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

      {isSinCfdiEfectivo && canRegisterOperationalCash ? (
        <RegisterOperationalCashSheet
          tripId={tripId}
          open={cashSheetOpen}
          onOpenChange={setCashSheetOpen}
          defaultAmount={baseRate}
        />
      ) : null}
    </div>
  );
}
