/**
 * TripExpenseSheet — Sheet lateral para agregar/editar costos operativos o gastos indirectos
 * (paso 4 del wizard de viajes). Patrón alineado con CargoMovementSheet y StopFormSheet.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type DefaultValues,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleDollarSign, Fuel, Receipt, Wallet } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  FormFieldShell,
  FormValidationSummary,
  MoneyInput,
  RHFMoneyField,
  RHFSelectField,
  RHFTextField,
  RHFTextareaField,
} from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";

import { formatMxCurrency } from "./financialSummary";
import {
  getCategoriesForKind,
  getDefaultCategoryForKind,
  type TripExpenseSheetKind,
} from "./expenseCategories";
import { tripExpenseSchema, type TripExpenseFormValues } from "../../pages/create/components/validation";
import { wizardCopy } from "../../copy";

const copy = wizardCopy.expense;

const DEFAULT_DIESEL_PRICE = 24.0;

export interface TripExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseKind: TripExpenseSheetKind;
  initialValues: TripExpenseFormValues | null;
  editingIndex: number | null;
  totalDistanceKm: number;
  expectedFuelEfficiency: number | null;
  onSubmit: (values: TripExpenseFormValues, editingIndex: number | null) => void;
}

function buildEmptyExpense(
  kind: TripExpenseSheetKind,
): DefaultValues<TripExpenseFormValues> {
  return {
    category: getDefaultCategoryForKind(kind),
    description: "",
    currency: "MXN",
    vendorName: "",
    notes: "",
    isEstimated: true,
  };
}

function buildEditDefaults(expense: TripExpenseFormValues): TripExpenseFormValues {
  return {
    ...expense,
    currency: "MXN",
    vendorName: expense.vendorName ?? "",
    notes: expense.notes ?? "",
    isEstimated: expense.isEstimated ?? true,
  };
}

function getSheetTitle(kind: TripExpenseSheetKind, isEdit: boolean): string {
  if (kind === "cost") {
    return isEdit ? copy.title.editCost : copy.title.addCost;
  }
  return isEdit ? copy.title.editExpense : copy.title.addExpense;
}

function collectFormErrorMessages(
  errors: Record<string, { message?: string } | undefined>,
): string[] {
  const messages: string[] = [];
  const seen = new Set<string>();
  for (const key of Object.keys(errors)) {
    const msg = errors[key]?.message;
    if (typeof msg === "string" && msg.length > 0 && !seen.has(msg)) {
      seen.add(msg);
      messages.push(msg);
    }
  }
  return messages;
}

export function TripExpenseSheet({
  open,
  onOpenChange,
  expenseKind,
  initialValues,
  editingIndex,
  totalDistanceKm,
  expectedFuelEfficiency,
  onSubmit,
}: TripExpenseSheetProps) {
  const [dieselPricePerLiter, setDieselPricePerLiter] =
    useState(DEFAULT_DIESEL_PRICE);
  const [showSummary, setShowSummary] = useState(false);

  const defaultValues = useMemo<DefaultValues<TripExpenseFormValues>>(() => {
    if (initialValues) return buildEditDefaults(initialValues);
    return buildEmptyExpense(expenseKind);
  }, [initialValues, expenseKind]);

  const form = useForm<TripExpenseFormValues>({
    resolver: zodResolver(tripExpenseSchema) as Resolver<TripExpenseFormValues>,
    defaultValues,
    mode: "onSubmit",
  });

  const { control, handleSubmit, reset, setValue, formState } = form;

  useEffect(() => {
    if (!open) {
      setShowSummary(false);
      setDieselPricePerLiter(DEFAULT_DIESEL_PRICE);
      return;
    }
    reset(defaultValues);
    setShowSummary(false);
  }, [open, defaultValues, reset]);

  const category = useWatch({ control, name: "category" });
  const categoryOptions = useMemo(
    () =>
      getCategoriesForKind(expenseKind).map((item) => ({
        value: item.value,
        label: (
          <span className="flex items-center gap-2">
            <item.icon className="h-4 w-4" />
            {item.label}
          </span>
        ),
      })),
    [expenseKind],
  );

  const dieselSuggestion = useMemo(() => {
    if (
      !expectedFuelEfficiency ||
      expectedFuelEfficiency <= 0 ||
      totalDistanceKm <= 0 ||
      dieselPricePerLiter <= 0
    ) {
      return null;
    }
    const liters = totalDistanceKm / expectedFuelEfficiency;
    const cost = liters * dieselPricePerLiter;
    return {
      liters: Math.round(liters * 10) / 10,
      cost: Math.round(cost * 100) / 100,
    };
  }, [dieselPricePerLiter, expectedFuelEfficiency, totalDistanceKm]);

  const showDieselEstimation =
    expenseKind === "cost" &&
    category === "fuel" &&
    totalDistanceKm > 0 &&
    !!expectedFuelEfficiency;

  const applyDieselSuggestion = () => {
    if (!dieselSuggestion) return;
    const currentDescription = form.getValues("description")?.trim();
    setValue("category", "fuel", { shouldDirty: true });
    setValue("description", currentDescription || copy.format.dieselDescription, {
      shouldDirty: true,
    });
    setValue("amount", dieselSuggestion.cost, { shouldDirty: true });
    setValue(
      "notes",
      copy.format.dieselNotes(dieselSuggestion.liters, dieselPricePerLiter),
      { shouldDirty: true },
    );
  };

  const submitSheet = handleSubmit(
    (values) => {
      const payload: TripExpenseFormValues = {
        ...values,
        id: values.id,
        currency: "MXN",
        description: values.description.trim(),
        vendorName: values.vendorName?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        isEstimated: true,
      };
      onSubmit(payload, editingIndex);
      onOpenChange(false);
    },
    () => {
      setShowSummary(true);
    },
  );

  const summaryMessages = useMemo(
    () =>
      collectFormErrorMessages(
        formState.errors as Record<string, { message?: string } | undefined>,
      ),
    [formState.errors],
  );
  const isSummaryVisible = showSummary && summaryMessages.length > 0;
  const isEdit = editingIndex !== null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="shrink-0 space-y-2 border-b px-6 py-4">
          <SheetTitle className="pr-8">
            {getSheetTitle(expenseKind, isEdit)}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {expenseKind === "cost" ? copy.hint.srCost : copy.hint.srExpense}
          </SheetDescription>
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
            {expenseKind === "cost" ? (
              <>
                <span className="font-medium text-foreground">{copy.hint.costKind}</span>
                : {copy.hint.costScope}
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">{copy.hint.expenseKind}</span>
                : {copy.hint.expenseScope}
              </>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          <FormSectionCard
            title={copy.section.classification}
            icon={<Receipt className="h-4 w-4" />}
            contentClassName="space-y-4"
          >
            <RHFSelectField
              control={control}
              name="category"
              fieldId="expense-category"
              label={copy.label.category}
              required
              options={categoryOptions}
            />
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <FormFieldShell fieldId="expense-currency" label={copy.label.currency}>
                  <Input
                    id="expense-currency"
                    value={field.value || "MXN"}
                    disabled
                    className="bg-muted"
                  />
                </FormFieldShell>
              )}
            />
          </FormSectionCard>

          <FormSectionCard
            title={copy.section.amount}
            icon={<CircleDollarSign className="h-4 w-4" />}
            contentClassName="space-y-4"
          >
            <RHFTextField
              control={control}
              name="description"
              fieldId="expense-description"
              label={copy.label.description}
              required
              placeholder={copy.placeholder.description}
            />
            <RHFMoneyField
              control={control}
              name="amount"
              fieldId="expense-amount"
              label={copy.label.amount}
              required
              placeholder={copy.placeholder.amount}
            />
          </FormSectionCard>

          {showDieselEstimation ? (
            <Card className="border-info/30 bg-info-soft/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {copy.section.dieselEstimate}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{copy.label.totalDistance}</p>
                    <p className="font-medium">{totalDistanceKm.toFixed(1)} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{copy.label.fuelEfficiency}</p>
                    <p className="font-medium">{expectedFuelEfficiency} km/L</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {copy.label.estimatedConsumption}
                    </p>
                    <p className="font-medium">{dieselSuggestion?.liters ?? "—"} L</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="w-44 space-y-1">
                    <Label className="text-xs">{copy.label.dieselPrice}</Label>
                    <MoneyInput
                      id="diesel-price-per-liter"
                      className="h-8 text-sm"
                      value={dieselPricePerLiter}
                      onValueChange={(next) =>
                        setDieselPricePerLiter(next ?? DEFAULT_DIESEL_PRICE)
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-xs text-muted-foreground">
                      {copy.label.estimatedCost}
                    </p>
                    <p className="text-xl font-bold text-info-soft-foreground">
                      {dieselSuggestion
                        ? formatMxCurrency(dieselSuggestion.cost)
                        : "—"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={applyDieselSuggestion}
                    disabled={!dieselSuggestion}
                  >
                    <Fuel className="mr-1 h-3.5 w-3.5" />
                    {copy.action.useEstimate}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <FormSectionCard
            title={copy.section.vendor}
            icon={<Wallet className="h-4 w-4" />}
            contentClassName="space-y-4"
          >
            <RHFTextField
              control={control}
              name="vendorName"
              fieldId="expense-vendor"
              label={copy.label.vendor}
              placeholder={copy.placeholder.vendor}
            />
            <RHFTextareaField
              control={control}
              name="notes"
              fieldId="expense-notes"
              label={copy.label.notes}
              placeholder={copy.placeholder.notes}
              rows={2}
            />
          </FormSectionCard>

          {isSummaryVisible ? (
            <FormValidationSummary
              title={copy.validation.summaryTitle}
              messages={summaryMessages}
            />
          ) : null}
        </div>

        <SheetFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {copy.action.cancel}
          </Button>
          <Button type="button" onClick={() => void submitSheet()}>
            {isEdit ? copy.action.saveChanges : copy.action.addConcept}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
