/**
 * TripExpenseSheet — Sheet lateral para agregar/editar conceptos del viaje
 * (paso 4 del wizard). Dos niveles: concepto + monto siempre visibles;
 * proveedor y notas colapsados. Estimación de diésel como ayuda del monto.
 */

import { useMemo, useState } from "react";
import {
  useForm,
  useWatch,
  type DefaultValues,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, CircleDollarSign, Fuel, Receipt, Wallet } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { Label } from "@shared/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import {
  FormValidationSummary,
  MoneyInput,
  RHFMoneyField,
  RHFSelectField,
  RHFTextField,
  RHFTextareaField,
} from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { cn } from "@shared/lib/utils/cn";
import { useToast } from "@shared/hooks";

import { formatMxCurrency } from "./financialSummary";
import {
  getCategoriesForKind,
  getDefaultCategoryForKind,
  type TripExpenseSheetKind,
} from "./expenseCategories";
import {
  tripExpenseSchema,
  type TripExpenseFormValues,
} from "../../pages/create/components/validation";
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
  onSubmit: (
    values: TripExpenseFormValues,
    editingIndex: number | null,
    options?: { keepOpen?: boolean },
  ) => void;
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
    return isEdit ? copy.title.editOperational : copy.title.addOperational;
  }
  return isEdit ? copy.title.editIndirect : copy.title.addIndirect;
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

function TripExpenseSheetSession({
  onOpenChange,
  expenseKind,
  initialValues,
  editingIndex,
  totalDistanceKm,
  expectedFuelEfficiency,
  onSubmit,
}: Omit<TripExpenseSheetProps, "open">) {
  const { success: showSuccessToast } = useToast();
  const [dieselPricePerLiter, setDieselPricePerLiter] =
    useState(DEFAULT_DIESEL_PRICE);
  const [showSummary, setShowSummary] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(() =>
    Boolean(
      initialValues?.vendorName?.trim() || initialValues?.notes?.trim(),
    ),
  );

  const defaultValues = useMemo<DefaultValues<TripExpenseFormValues>>(() => {
    if (initialValues) return buildEditDefaults(initialValues);
    return buildEmptyExpense(expenseKind);
  }, [initialValues, expenseKind]);

  const form = useForm<TripExpenseFormValues>({
    resolver: zodResolver(tripExpenseSchema) as Resolver<TripExpenseFormValues>,
    defaultValues,
    mode: "onSubmit",
  });

  const { control, handleSubmit, reset, setValue, getValues, formState } = form;

  const category = useWatch({ control, name: "category" });
  const vendorName = useWatch({ control, name: "vendorName" });
  const notesValue = useWatch({ control, name: "notes" });

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
    const currentDescription = getValues("description")?.trim();
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
    setExtrasOpen(true);
  };

  const buildPayload = (values: TripExpenseFormValues): TripExpenseFormValues => ({
    ...values,
    id: values.id,
    currency: "MXN",
    description: values.description.trim(),
    vendorName: values.vendorName?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
    isEstimated: true,
  });

  const submitSheet = handleSubmit(
    (values) => {
      onSubmit(buildPayload(values), editingIndex);
      onOpenChange(false);
    },
    () => {
      setShowSummary(true);
    },
  );

  const handleAddAnother = () => {
    void handleSubmit(
      (values) => {
        const result = buildPayload(values);
        onSubmit(result, null, { keepOpen: true });
        reset(buildEmptyExpense(expenseKind));
        setDieselPricePerLiter(DEFAULT_DIESEL_PRICE);
        setExtrasOpen(false);
        setShowSummary(false);
        showSuccessToast(
          copy.toast.addedTitle,
          copy.toast.addedBody(result.description),
        );
      },
      () => {
        setShowSummary(true);
      },
    )();
  };

  const summaryMessages = useMemo(
    () =>
      collectFormErrorMessages(
        formState.errors as Record<string, { message?: string } | undefined>,
      ),
    [formState.errors],
  );
  const isSummaryVisible = showSummary && summaryMessages.length > 0;
  const isEdit = editingIndex !== null;
  const hasExtras =
    Boolean(vendorName?.trim()) || Boolean(notesValue?.trim());

  return (
    <SheetContent
      side="right"
      className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
    >
      <SheetHeader className="shrink-0 space-y-2 border-b px-6 py-4">
        <SheetTitle className="pr-8">
          {getSheetTitle(expenseKind, isEdit)}
        </SheetTitle>
        <SheetDescription className="sr-only">
          {expenseKind === "cost" ? copy.hint.srOperational : copy.hint.srIndirect}
        </SheetDescription>
        <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {expenseKind === "cost"
              ? copy.hint.operationalKind
              : copy.hint.indirectKind}
          </span>
          {": "}
          {expenseKind === "cost"
            ? copy.hint.operationalScope
            : copy.hint.indirectScope}
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        <FormSectionCard
          title={copy.section.concept}
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
          <RHFTextField
            control={control}
            name="description"
            fieldId="expense-description"
            label={copy.label.description}
            required
            placeholder={copy.placeholder.description}
          />
        </FormSectionCard>

        <FormSectionCard
          title={copy.section.amount}
          icon={<CircleDollarSign className="h-4 w-4" />}
          contentClassName="space-y-4"
        >
          <RHFMoneyField
            control={control}
            name="amount"
            fieldId="expense-amount"
            label={copy.label.amount}
            required
            placeholder={copy.placeholder.amount}
          />

          {showDieselEstimation ? (
            <div className="space-y-3 rounded-lg border border-info/30 bg-info-soft/40 p-3">
              <p className="text-sm font-medium text-info-soft-foreground">
                {copy.section.dieselHelp}
              </p>
              {expectedFuelEfficiency ? (
                <p className="text-xs text-muted-foreground">
                  {copy.format.dieselHelpBody(
                    totalDistanceKm,
                    expectedFuelEfficiency,
                  )}
                </p>
              ) : null}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {copy.label.totalDistance}
                  </p>
                  <p className="font-medium">{totalDistanceKm.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {copy.label.fuelEfficiency}
                  </p>
                  <p className="font-medium">{expectedFuelEfficiency} km/L</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {copy.label.estimatedConsumption}
                  </p>
                  <p className="font-medium">
                    {dieselSuggestion?.liters ?? "—"} L
                  </p>
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
                  <p className="text-lg font-bold text-info-soft-foreground">
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
            </div>
          ) : null}
        </FormSectionCard>

        <Card>
          <Collapsible open={extrasOpen} onOpenChange={setExtrasOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left">
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-base font-semibold leading-none tracking-tight">
                  <span className="text-muted-foreground">
                    <Wallet className="h-4 w-4" />
                  </span>
                  {copy.section.extras}
                </span>
                <span className="mt-1 block truncate text-sm font-normal text-muted-foreground">
                  {hasExtras
                    ? copy.sectionSummary.extrasFilled
                    : copy.sectionSummary.extrasEmpty}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  extrasOpen && "rotate-180",
                )}
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
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
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

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
        {!isEdit ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddAnother}
          >
            {copy.action.addAnother}
          </Button>
        ) : null}
        <Button type="button" onClick={() => void submitSheet()}>
          {isEdit ? copy.action.saveChanges : copy.action.addConcept}
        </Button>
      </SheetFooter>
    </SheetContent>
  );
}

export function TripExpenseSheet({
  open,
  onOpenChange,
  expenseKind,
  initialValues,
  editingIndex,
  ...rest
}: TripExpenseSheetProps) {
  const sessionKey = `${editingIndex ?? "new"}-${expenseKind}-${initialValues?.category ?? ""}-${initialValues?.description ?? ""}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {open ? (
        <TripExpenseSheetSession
          key={sessionKey}
          onOpenChange={onOpenChange}
          expenseKind={expenseKind}
          initialValues={initialValues}
          editingIndex={editingIndex}
          {...rest}
        />
      ) : null}
    </Sheet>
  );
}
