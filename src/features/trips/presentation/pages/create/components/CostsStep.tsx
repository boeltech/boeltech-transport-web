import { useMemo, useState } from "react";
import type { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { AlertCircle, CircleDollarSign, DollarSign, Plus, Receipt } from "lucide-react";

import { useVehicle } from "@features/vehicles/application";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailAlertCard } from "@shared/ui/data-display";
import { FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";
import { TripExpenseEditableList } from "../../../components/trip-costs";
import { Input } from "@shared/ui/input";

import {
  getSheetKindForCategory,
  isIndirectExpenseCategory,
  isOperationalExpenseCategory,
  TripExpenseSheet,
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
  ) => {
    if (submittedIndex !== null) {
      update(submittedIndex, values);
    } else {
      append(values);
    }
    setInitialExpense(null);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 shrink-0" />
                {copy.section.income}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                control={form.control}
                name="baseRate"
                render={({ field, fieldState }) => (
                  <FormFieldShell
                    fieldId="baseRate"
                    className="max-w-sm"
                    label={copy.label.baseRate}
                    required={baseRateRequired}
                    description={
                      cfdiDocumentIntent === "traslado"
                        ? copy.hint.baseRateTraslado
                        : baseRateRequired
                          ? copy.hint.baseRateRequired
                          : copy.hint.baseRateNoClient
                    }
                    errorMessage={fieldState.error?.message}
                  >
                    <Input
                      id="baseRate"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      error={Boolean(fieldState.error)}
                      {...getFieldErrorAriaProps(
                        "baseRate",
                        fieldState.error?.message,
                      )}
                    />
                  </FormFieldShell>
                )}
              />
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
                {copy.action.addCost}
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
                {copy.action.addExpense}
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
          className="xl:sticky xl:top-4"
          snapshot={financialSnapshot}
        />
      </div>

      {financial.health === "critical" ? (
        <DetailAlertCard
          severity="critical"
          icon={<AlertCircle className="h-4 w-4" />}
          title={copy.alert.marginCriticalTitle}
          items={[
            {
              text: copy.alert.marginCriticalBody,
            },
          ]}
        />
      ) : null}

      <TripExpenseSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
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
