import { useMemo, useState } from "react";
import type { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import { CircleDollarSign, DollarSign, Plus, Receipt } from "lucide-react";

import { useClientCreditSummary } from "@features/clients/application";
import { useVehicle } from "@features/vehicles/application";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { CreditExposureCard } from "@shared/ui/data-display";
import { RHFMoneyField } from "@shared/ui/form";
import { TripExpenseEditableList } from "../../../components/trip-costs";

import {
  getSheetKindForCategory,
  isIndirectExpenseCategory,
  isOperationalExpenseCategory,
  TripExpenseSheet,
  TripResultStrip,
  TripWizardFinancialSummary,
  buildTripWizardFinancialSnapshot,
  type TripExpenseSheetKind,
} from "../../../components/trip-financial";
import { wizardHasContractingClient } from "./validation";
import type { TripExpenseFormValues, TripWizardFormValues } from "./validation";
import { wizardCopy } from "../../../copy";

const copy = wizardCopy.costs;

interface CostsStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  expensesFieldArray: UseFieldArrayReturn<TripWizardFormValues, "expenses">;
}

export function CostsStep({ form, expensesFieldArray }: CostsStepProps) {
  const { fields, append, remove, update } = expensesFieldArray;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKind, setSheetKind] = useState<TripExpenseSheetKind>("cost");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [initialExpense, setInitialExpense] = useState<TripExpenseFormValues | null>(
    null,
  );

  const vehicleId = form.watch("vehicleId");
  const stops = form.watch("stops");
  const baseRate = form.watch("baseRate") ?? 0;
  const cfdiDocumentIntent = form.watch("cfdiDocumentIntent") ?? "ingreso";
  const clientId = form.watch("clientId");
  const baseRateRequired =
    cfdiDocumentIntent === "ingreso" && wizardHasContractingClient(clientId);

  const hasContractingClient = wizardHasContractingClient(clientId);
  const creditSummaryQuery = useClientCreditSummary(
    hasContractingClient ? clientId : undefined,
    baseRate > 0 ? baseRate : undefined,
    { enabled: hasContractingClient },
  );

  const { data: vehicle } = useVehicle(vehicleId);
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

  const operationalCosts = useMemo(
    () =>
      fields.filter((expense) =>
        isOperationalExpenseCategory(expense.category),
      ),
    [fields],
  );
  const indirectExpenses = useMemo(
    () =>
      fields.filter((expense) =>
        isIndirectExpenseCategory(expense.category),
      ),
    [fields],
  );

  const financialSnapshot = useMemo(
    () => buildTripWizardFinancialSnapshot(baseRate, fields),
    [baseRate, fields],
  );
  const { financial } = financialSnapshot;

  const handleOpenAdd = (kind: TripExpenseSheetKind) => {
    setSheetKind(kind);
    setEditingIndex(null);
    setInitialExpense(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (index: number) => {
    const expense = fields[index];
    if (!expense) return;
    setSheetKind(getSheetKindForCategory(expense.category));
    setEditingIndex(index);
    setInitialExpense(expense);
    setSheetOpen(true);
  };

  const handleSubmitFromSheet = (
    values: TripExpenseFormValues,
    submittedIndex: number | null,
    options?: { keepOpen?: boolean },
  ) => {
    if (submittedIndex !== null) {
      update(submittedIndex, values);
    } else {
      append(values);
    }
    setInitialExpense(null);
    setEditingIndex(null);
    if (!options?.keepOpen) {
      setSheetOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <TripResultStrip
        income={financial.baseRate}
        conceptsTotal={financial.totalExpenses}
        utility={financial.margin}
        marginPct={financial.marginPct}
        health={financial.health}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 shrink-0" />
                {copy.section.income}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-sm space-y-4">
                <RHFMoneyField
                  control={form.control}
                  name="baseRate"
                  fieldId="baseRate"
                  label={copy.label.baseRate}
                  required={baseRateRequired}
                  description={
                    cfdiDocumentIntent === "traslado"
                      ? copy.hint.baseRateTraslado
                      : baseRateRequired
                        ? copy.hint.baseRateRequired
                        : copy.hint.baseRateNoClient
                  }
                />
                {hasContractingClient ? (
                  <CreditExposureCard
                    variant="compact"
                    summary={creditSummaryQuery.data}
                    isLoading={creditSummaryQuery.isLoading}
                    isError={creditSummaryQuery.isError}
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CircleDollarSign className="h-5 w-5 shrink-0" />
                {copy.section.operational}
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenAdd("cost")}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                {copy.action.addOperational}
              </Button>
            </CardHeader>
            <CardContent>
              <TripExpenseEditableList
                items={operationalCosts}
                emptyTitle={copy.state.emptyOperationalTitle}
                emptyDescription={copy.state.emptyOperationalDescription}
                onEdit={(id) => {
                  const index = fields.findIndex((item) => item.id === id);
                  if (index >= 0) handleOpenEdit(index);
                }}
                onRemove={(id) => {
                  const index = fields.findIndex((item) => item.id === id);
                  if (index >= 0) remove(index);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 shrink-0" />
                {copy.section.indirect}
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenAdd("expense")}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                {copy.action.addIndirect}
              </Button>
            </CardHeader>
            <CardContent>
              <TripExpenseEditableList
                items={indirectExpenses}
                emptyTitle={copy.state.emptyIndirectTitle}
                emptyDescription={copy.state.emptyIndirectDescription}
                onEdit={(id) => {
                  const index = fields.findIndex((item) => item.id === id);
                  if (index >= 0) handleOpenEdit(index);
                }}
                onRemove={(id) => {
                  const index = fields.findIndex((item) => item.id === id);
                  if (index >= 0) remove(index);
                }}
              />
            </CardContent>
          </Card>
        </div>

        <TripWizardFinancialSummary
          className="xl:sticky xl:top-36"
          snapshot={financialSnapshot}
          variant="totals"
        />
      </div>

      <TripExpenseSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setEditingIndex(null);
            setInitialExpense(null);
          }
        }}
        expenseKind={sheetKind}
        initialValues={initialExpense}
        editingIndex={editingIndex}
        totalDistanceKm={totalDistanceKm}
        expectedFuelEfficiency={expectedFuelEfficiency}
        onSubmit={handleSubmitFromSheet}
      />
    </div>
  );
}
