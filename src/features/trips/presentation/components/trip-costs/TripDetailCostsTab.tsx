import { useMemo, useState } from "react";
import {
  AlertCircle,
  CircleDollarSign,
  Plus,
  Receipt,
} from "lucide-react";

import {
  useAddExpense,
  useDeleteExpense,
  useUpdateExpense,
} from "@features/trips/application/hooks/expense/useExpenseOperations";
import {
  TripStatus,
  type ExpensesSummary,
  type TripExpense,
  type TripStop,
} from "@features/trips/domain";
import { useVehicle } from "@features/vehicles/application";
import { useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailAlertCard } from "@shared/ui/data-display";
import { TripBaseRateCard } from "./TripBaseRateCard";
import { Skeleton } from "@shared/ui/skeleton";

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
import { TripExpenseEditableList } from "./TripExpenseEditableList";
import {
  formValuesToCreateExpenseInput,
  formValuesToUpdateExpenseInput,
  tripExpenseToFormValues,
  tripExpensesToListItems,
  tripExpensesToWizardLines,
} from "./tripExpenseFormBridge";
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
  /** Gastos/costos: draft/scheduled/in_progress + permiso. */
  canManageExpenses: boolean;
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
  canManageExpenses,
}: TripDetailCostsTabProps) {
  const { toast } = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKind, setSheetKind] = useState<TripExpenseSheetKind>("cost");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [initialExpense, setInitialExpense] = useState<TripExpenseFormValues | null>(
    null,
  );

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

  const financialSnapshot = useMemo(
    () => buildTripWizardFinancialSnapshot(baseRate, expenseLines),
    [baseRate, expenseLines],
  );

  const categoryEntries = useMemo(() => {
    if (expensesSummary && Object.keys(expensesSummary.byCategory).length > 0) {
      return Object.entries(expensesSummary.byCategory) as [string, number][];
    }
    return null;
  }, [expensesSummary]);

  const expensesReadOnly = !canManageExpenses;
  const baseRateReadOnly = !canEditBaseRate;

  const handleOpenAdd = (kind: TripExpenseSheetKind) => {
    setSheetKind(kind);
    setEditingExpenseId(null);
    setInitialExpense(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (expenseId: string) => {
    const expense = expenses.find((item) => item.id === expenseId);
    if (!expense) return;
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

  return (
    <div className="space-y-6">
      {tripStatus === TripStatus.IN_PROGRESS && canManageExpenses ? (
        <DetailAlertCard
          severity="info"
          icon={<CircleDollarSign className="h-4 w-4" />}
          title={copy.alert.inProgressTitle}
          items={[{ text: copy.hint.inProgress }]}
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
          />

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CircleDollarSign className="h-5 w-5 shrink-0" />
                {copy.section.operational}
              </CardTitle>
              {!expensesReadOnly ? (
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
                readOnly={expensesReadOnly}
                emptyTitle={copy.state.emptyOperationalTitle}
                emptyDescription={
                  expensesReadOnly
                    ? copy.state.emptyOperationalReadOnly
                    : copy.state.emptyOperationalEditable
                }
                onEdit={expensesReadOnly ? undefined : handleOpenEdit}
                onRemove={expensesReadOnly ? undefined : handleRemove}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 shrink-0" />
                {copy.section.indirect}
              </CardTitle>
              {!expensesReadOnly ? (
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
                readOnly={expensesReadOnly}
                emptyTitle={copy.state.emptyIndirectTitle}
                emptyDescription={
                  expensesReadOnly
                    ? copy.state.emptyIndirectReadOnly
                    : copy.state.emptyIndirectEditable
                }
                onEdit={expensesReadOnly ? undefined : handleOpenEdit}
                onRemove={expensesReadOnly ? undefined : handleRemove}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24">
          <TripWizardFinancialSummary
            className="h-fit"
            snapshot={financialSnapshot}
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

      {!expensesReadOnly ? (
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
    </div>
  );
}
