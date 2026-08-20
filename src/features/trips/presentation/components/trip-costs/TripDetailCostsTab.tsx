import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CircleDollarSign,
  Plus,
  Receipt,
} from "lucide-react";

import { RejectExpenseSheet } from "@features/approvals";
import {
  useAddExpense,
  useApproveExpense,
  useDeleteExpense,
  useRejectExpense,
  useUpdateExpense,
} from "@features/trips/application/hooks/expense/useExpenseOperations";
import {
  TripStatus,
  type ExpensesSummary,
  type TripExpense,
  type TripInvoiceStatus,
  type TripOperationalOutcomeType,
  type TripStop,
} from "@features/trips/domain";
import { useVehicle } from "@features/vehicles/application";
import { useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailAlertCard } from "@shared/ui/data-display";
import { TripBaseRateCard } from "./TripBaseRateCard";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDateTime } from "@shared/utils/dateUtils";

import {
  getSheetKindForCategory,
  type TripExpenseSheetKind,
  isIndirectExpenseCategory,
  isOperationalExpenseCategory,
  TripExpenseSheet,
  TripWizardFinancialSummary,
  buildTripWizardFinancialSnapshot,
} from "../trip-financial";
import type { TripExpenseFormValues } from "../../pages/create/components/validation";
import { TripCostsCategoryBreakdown } from "./TripCostsCategoryBreakdown";
import {
  TripExpenseEditableList,
  type TripExpenseListItem,
} from "./TripExpenseEditableList";
import {
  formValuesToCreateExpenseInput,
  formValuesToUpdateExpenseInput,
  tripExpenseToFormValues,
  tripExpensesToListItems,
  tripExpensesToWizardLines,
} from "./tripExpenseFormBridge";
import { tripExpenseToRejectApprovableItem } from "./tripExpenseRejectApprovableItem";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.costs;

export interface TripDetailCostsTabProps {
  tripId: string;
  tripStatus: string;
  baseRate: number;
  cfdiDocumentIntent: "ingreso" | "traslado";
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
  /** Editar gastos (en completed solo pending). */
  canUpdatePendingExpenses: boolean;
  /** Eliminar gastos (en completed solo pending). */
  canDeletePendingExpenses: boolean;
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

export function TripDetailCostsTab({
  tripId,
  tripStatus,
  baseRate,
  cfdiDocumentIntent,
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
  const canViewApprovalsHub = hasPermission("finance_approvals", "read");
  const approvalsHubPath = useMemo(() => {
    const params = new URLSearchParams({
      tab: "approvals",
      status: "pending",
      type: "trip_expense",
      tripId,
    });
    if (tripCode) {
      params.set("tripCode", tripCode);
    }
    return `/finance?${params.toString()}`;
  }, [tripCode, tripId]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKind, setSheetKind] = useState<TripExpenseSheetKind>("cost");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [initialExpense, setInitialExpense] = useState<TripExpenseFormValues | null>(
    null,
  );
  const [rejectSheetOpen, setRejectSheetOpen] = useState(false);
  const [expenseToReject, setExpenseToReject] = useState<TripExpense | null>(null);

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
      : copy.incomeSource.rateUnstamped;
  }, [invoiceStatus, isCompleted]);

  const queuedCostsHint =
    isCompleted && financialSnapshot.queuedCostsTotal > 0
      ? copy.financialSummary.hint.queuedMayLower
      : null;

  const categoryEntries = useMemo(() => {
    if (expensesSummary && Object.keys(expensesSummary.byCategory).length > 0) {
      return Object.entries(expensesSummary.byCategory) as [string, number][];
    }
    return null;
  }, [expensesSummary]);

  const showAddButtons = canCreateExpenses;
  const showExpenseSheet = canCreateExpenses || canUpdatePendingExpenses;
  const listReadOnly =
    !canUpdatePendingExpenses && !canDeletePendingExpenses && !canCreateExpenses;
  const emptyEditable = canCreateExpenses;
  const emptyReadOnlyDescription =
    operationalOutcome === "false_trip"
      ? copy.state.emptyAfterFalseTrip
      : expenseWindowClosed
        ? formatWindowHint(copy.hint.postCloseWindowClosed, expenseWindowClosesAt)
        : undefined;
  const baseRateReadOnly = !canEditBaseRate;

  const canEditItem = (item: TripExpenseListItem) => {
    if (!canUpdatePendingExpenses) return false;
    if (!isCompleted) return true;
    return item.status === "pending";
  };
  const canRemoveItem = (item: TripExpenseListItem) => {
    if (!canDeletePendingExpenses) return false;
    if (!isCompleted) return true;
    return item.status === "pending";
  };

  const approveHandlers = canApproveExpenses
    ? {
        onApprove: async (expenseId: string) => {
          try {
            await approveExpense.mutateAsync(expenseId);
            toast({ title: copy.toast.approved, variant: "success" });
          } catch (error) {
            toast({
              title: copy.toast.approveError,
              description: error instanceof Error ? error.message : undefined,
              variant: "error",
            });
          }
        },
        onReject: (expenseId: string) => {
          const expense = expenses.find((item) => item.id === expenseId);
          if (!expense) return;
          setExpenseToReject(expense);
          setRejectSheetOpen(true);
        },
      }
    : { onApprove: undefined, onReject: undefined };

  const rejectApprovableItem = useMemo(
    () =>
      expenseToReject
        ? tripExpenseToRejectApprovableItem(expenseToReject, tripId, tripCode)
        : null,
    [expenseToReject, tripCode, tripId],
  );

  const handleRejectSubmit = async (reason: string) => {
    if (!expenseToReject) return;
    try {
      await rejectExpense.mutateAsync({
        expenseId: expenseToReject.id,
        reason,
      });
      toast({ title: copy.toast.rejected, variant: "success" });
      setRejectSheetOpen(false);
      setExpenseToReject(null);
    } catch (error) {
      toast({
        title: copy.toast.rejectError,
        description: error instanceof Error ? error.message : undefined,
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
    if (!expense) return;
    if (isCompleted && expense.status !== "pending") return;
    setSheetKind(getSheetKindForCategory(expense.category));
    setEditingExpenseId(expenseId);
    setInitialExpense(tripExpenseToFormValues(expense));
    setSheetOpen(true);
  };

  const handleRemove = async (expenseId: string) => {
    try {
      await deleteExpense.mutateAsync(expenseId);
      toast({ title: copy.toast.removed, variant: "success" });
    } catch (error) {
      toast({
        title: copy.toast.removeError,
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    }
  };

  const handleSubmitFromSheet = async (values: TripExpenseFormValues) => {
    try {
      if (editingExpenseId) {
        await updateExpense.mutateAsync({
          expenseId: editingExpenseId,
          data: formValuesToUpdateExpenseInput(values),
        });
        toast({ title: copy.toast.updated, variant: "success" });
      } else {
        await addExpense.mutateAsync(formValuesToCreateExpenseInput(values));
        toast({ title: copy.toast.created, variant: "success" });
      }
      setSheetOpen(false);
      setEditingExpenseId(null);
      setInitialExpense(null);
    } catch (error) {
      toast({
        title: copy.toast.saveError,
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
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

  return (
    <div className="space-y-6">
      {tripStatus === TripStatus.IN_PROGRESS && manageHint ? (
        <DetailAlertCard
          severity="info"
          icon={<CircleDollarSign className="h-4 w-4" />}
          title={copy.alert.inProgressTitle}
          items={[{ text: copy.hint.inProgress }]}
        />
      ) : null}

      {expenseWindowOpen ? (
        <DetailAlertCard
          severity="info"
          icon={<CircleDollarSign className="h-4 w-4" />}
          title={copy.alert.postCloseWindowTitle}
          items={[
            {
              text: formatWindowHint(
                copy.hint.postCloseWindow,
                expenseWindowClosesAt,
              ),
            },
          ]}
        />
      ) : null}

      {expenseWindowClosed ? (
        <DetailAlertCard
          severity="info"
          icon={<CircleDollarSign className="h-4 w-4" />}
          title={copy.alert.postCloseWindowClosedTitle}
          items={[
            {
              text: formatWindowHint(
                copy.hint.postCloseWindowClosed,
                expenseWindowClosesAt,
              ),
            },
          ]}
        />
      ) : null}

      {pendingExpenseCount > 0 ? (
        <DetailAlertCard
          severity="warning"
          icon={<Receipt className="h-4 w-4" />}
          title={copy.alert.pendingApprovalTitle}
          items={[
            {
              text: canApproveExpenses
                ? copy.alert.pendingApprovalBodyCanApprove
                : copy.alert.pendingApprovalBody,
            },
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
          ]}
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
                canEditItem={canEditItem}
                canRemoveItem={canRemoveItem}
                onEdit={canUpdatePendingExpenses ? handleOpenEdit : undefined}
                onRemove={canDeletePendingExpenses ? handleRemove : undefined}
                onApprove={approveHandlers.onApprove}
                onReject={approveHandlers.onReject}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 shrink-0" />
                {copy.section.indirect}
              </CardTitle>
              {showAddButtons ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
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
                canEditItem={canEditItem}
                canRemoveItem={canRemoveItem}
                onEdit={canUpdatePendingExpenses ? handleOpenEdit : undefined}
                onRemove={canDeletePendingExpenses ? handleRemove : undefined}
                onApprove={approveHandlers.onApprove}
                onReject={approveHandlers.onReject}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24">
          <TripWizardFinancialSummary
            className="h-fit"
            snapshot={financialSnapshot}
            title={
              isCompleted
                ? copy.financialSummary.section.title
                : copy.financialSummary.section.titleEstimated
            }
            incomeSourceLabel={incomeSourceLabel}
            queuedCostsHint={queuedCostsHint}
            marginLabel={
              isCompleted
                ? copy.financialSummary.label.marginApproved
                : undefined
            }
          />
          {categoryEntries ? (
            <TripCostsCategoryBreakdown entries={categoryEntries} />
          ) : null}
        </div>
      </div>

      {financial.health === "critical" && baseRate > 0 ? (
        <DetailAlertCard
          severity="critical"
          icon={<AlertCircle className="h-4 w-4" />}
          title={copy.alert.marginCriticalTitle}
          items={[{ text: copy.alert.marginCriticalBody }]}
        />
      ) : null}

      {showExpenseSheet ? (
        <TripExpenseSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          expenseKind={sheetKind}
          initialValues={initialExpense}
          editingIndex={editingExpenseId ? 0 : null}
          totalDistanceKm={totalDistanceKm}
          expectedFuelEfficiency={expectedFuelEfficiency}
          onSubmit={(values) => {
            void handleSubmitFromSheet(values);
          }}
        />
      ) : null}

      {canApproveExpenses ? (
        <RejectExpenseSheet
          open={rejectSheetOpen}
          onOpenChange={(open) => {
            setRejectSheetOpen(open);
            if (!open) setExpenseToReject(null);
          }}
          item={rejectApprovableItem}
          isSubmitting={rejectExpense.isPending}
          onSubmit={(reason) => {
            void handleRejectSubmit(reason);
          }}
        />
      ) : null}
    </div>
  );
}
