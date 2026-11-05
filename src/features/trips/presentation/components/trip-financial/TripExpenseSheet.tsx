/**
 * TripExpenseSheet — Sheet lateral para agregar/editar conceptos del viaje
 * (paso 4 del wizard). Dos niveles: concepto + monto siempre visibles;
 * proveedor y notas colapsados. Estimación de diésel como ayuda del monto.
 */

import { useMemo, useState, type ReactNode } from "react";
import {
  Controller,
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
import { Checkbox } from "@shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import {
  FieldInlineError,
  FormValidationSummary,
  getFieldErrorAriaProps,
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
  emptyReturnSaveShape,
  formatKmInput,
  parseReturnKm,
  quoteEmptyReturnFuel,
  type EmptyReturnScope,
  type FuelPortionQuote,
} from "./emptyReturnFuel";
import { tripDetailCopy } from "../../copy";
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
const psCopy = tripDetailCopy.costs.paymentSource;

const DEFAULT_DIESEL_PRICE = 24.0;

const PAYMENT_SOURCE_OPTIONS = [
  { value: "driver" as const, emoji: "🚛", label: psCopy.driver },
  { value: "company" as const, emoji: "🏢", label: psCopy.company },
  { value: "advance" as const, emoji: "💰", label: psCopy.advance },
];

const EMPTY_RETURN_SCOPES: { value: EmptyReturnScope; label: string }[] = [
  { value: "route", label: copy.emptyReturn.scopeRoute },
  { value: "both", label: copy.emptyReturn.scopeBoth },
  { value: "return", label: copy.emptyReturn.scopeReturn },
];

const PAYMENT_SOURCE_HINTS: Record<string, string> = {
  driver: psCopy.hintDriver,
  company: psCopy.hintCompany,
  advance: psCopy.hintAdvance,
};

export interface TripExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseKind: TripExpenseSheetKind;
  initialValues: TripExpenseFormValues | null;
  editingIndex: number | null;
  totalDistanceKm: number;
  expectedFuelEfficiency: number | null;
  /** Fuel sin marca ya capturado. El modo combinado no vuelve a crear la ruta. */
  hasUnmarkedRouteFuel?: boolean;
  isSubmitting?: boolean;
  onSubmit: (
    values: TripExpenseFormValues,
    editingIndex: number | null,
    options?: { keepOpen?: boolean; companion?: TripExpenseFormValues },
  ) => void | boolean | Promise<void | boolean>;
  /** Aviso al inicio del cuerpo (p. ej. motivo de devolución, ADR-0099 D15). */
  notice?: ReactNode;
  /** Sustituye el texto del primario en edición (p. ej. «Guardar y reenviar»). */
  submitLabel?: string;
}

function buildEmptyExpense(
  kind: TripExpenseSheetKind,
): DefaultValues<TripExpenseFormValues> {
  return {
    category: getDefaultCategoryForKind(kind),
    description: "",
    currency: "MXN",
    // Sin preselección: el operador debe elegir quién fondeó (D3)
    vendorName: "",
    notes: "",
    isEmptyReturn: false,
  };
}

function buildEditDefaults(expense: TripExpenseFormValues): TripExpenseFormValues {
  return {
    ...expense,
    currency: expense.currency ?? "MXN",
    paymentSource: expense.paymentSource,
    vendorName: expense.vendorName ?? "",
    notes: expense.notes ?? "",
    isEmptyReturn: expense.isEmptyReturn === true,
  };
}

type ArmedEstimate =
  | { shape: "route" }
  | { shape: "return" }
  | { shape: "pair"; emptyReturn: FuelPortionQuote };

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
  open,
  onOpenChange,
  expenseKind,
  initialValues,
  editingIndex,
  totalDistanceKm,
  expectedFuelEfficiency,
  hasUnmarkedRouteFuel = false,
  isSubmitting = false,
  onSubmit,
  notice,
  submitLabel,
}: TripExpenseSheetProps) {
  const { success: showSuccessToast } = useToast();
  const [dieselPricePerLiter, setDieselPricePerLiter] =
    useState(DEFAULT_DIESEL_PRICE);
  const [scope, setScope] = useState<EmptyReturnScope>("route");
  const [returnKm, setReturnKm] = useState("");
  const [applied, setApplied] = useState<ArmedEstimate | null>(null);
  const [distanceDialogOpen, setDistanceDialogOpen] = useState(false);
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
  const paymentSource = useWatch({ control, name: "paymentSource" });
  const vendorName = useWatch({ control, name: "vendorName" });
  const notesValue = useWatch({ control, name: "notes" });
  const paymentSourceError = formState.errors.paymentSource?.message;

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

  const isEdit = editingIndex !== null;
  const editingReturn =
    isEdit && category === "fuel" && initialValues?.isEmptyReturn === true;
  const activeScope: EmptyReturnScope = editingReturn
    ? "return"
    : isEdit
      ? "route"
      : scope;

  const showDieselEstimation =
    expenseKind === "cost" &&
    category === "fuel" &&
    totalDistanceKm > 0 &&
    !!expectedFuelEfficiency &&
    expectedFuelEfficiency > 0;

  const showEmptyReturnCheckbox =
    expenseKind === "cost" &&
    category === "fuel" &&
    (!showDieselEstimation || editingReturn);

  const parsedReturnKm = parseReturnKm(returnKm);
  const showReturnKm = showDieselEstimation && activeScope !== "route";
  const returnKmMissing = showReturnKm && parsedReturnKm == null;
  const returnKmError = returnKmMissing ? copy.emptyReturn.returnKmError : undefined;

  const fuelQuote = useMemo(() => {
    if (!showDieselEstimation || !expectedFuelEfficiency) {
      return { route: null, emptyReturn: null, total: 0 };
    }
    return quoteEmptyReturnFuel({
      scope: activeScope,
      routeKm: totalDistanceKm,
      returnKm: parsedReturnKm ?? 0,
      kmPerLiter: expectedFuelEfficiency,
      pricePerLiter: dieselPricePerLiter,
    });
  }, [
    activeScope,
    dieselPricePerLiter,
    expectedFuelEfficiency,
    parsedReturnKm,
    showDieselEstimation,
    totalDistanceKm,
  ]);

  const saveShape = emptyReturnSaveShape({
    scope: activeScope,
    hasUnmarkedRouteFuel: !isEdit && hasUnmarkedRouteFuel,
  });

  const canApplyEstimate =
    showDieselEstimation &&
    (saveShape === "route"
      ? fuelQuote.route != null
      : saveShape === "return"
        ? fuelQuote.emptyReturn != null
        : fuelQuote.route != null && fuelQuote.emptyReturn != null);

  const fillPortion = (portion: FuelPortionQuote, kind: "route" | "return") => {
    const currentDescription = getValues("description")?.trim();
    const defaultDescription =
      kind === "return"
        ? copy.format.dieselEmptyReturnDescription
        : copy.format.dieselDescription;
    setValue("category", "fuel", { shouldDirty: true });
    setValue("description", currentDescription || defaultDescription, {
      shouldDirty: true,
    });
    setValue("amount", portion.amount, { shouldDirty: true });
    setValue(
      "notes",
      copy.format.dieselNotes(portion.litersDisplay, dieselPricePerLiter),
      { shouldDirty: true },
    );
    setValue("isEmptyReturn", kind === "return", { shouldDirty: true });
    setExtrasOpen(true);
  };

  const applyDieselSuggestion = () => {
    if (!canApplyEstimate) return;
    if (saveShape === "pair" && fuelQuote.route && fuelQuote.emptyReturn) {
      fillPortion(fuelQuote.route, "route");
      setApplied({ shape: "pair", emptyReturn: fuelQuote.emptyReturn });
      return;
    }
    if (saveShape === "return" && fuelQuote.emptyReturn) {
      fillPortion(fuelQuote.emptyReturn, "return");
      setApplied({ shape: "return" });
      return;
    }
    if (fuelQuote.route) {
      fillPortion(fuelQuote.route, "route");
      setApplied({ shape: "route" });
    }
  };

  const confirmRouteDistance = () => {
    setReturnKm(formatKmInput(totalDistanceKm));
    setApplied(null);
    setDistanceDialogOpen(false);
  };

  const resolveEmptyReturn = (values: TripExpenseFormValues): boolean => {
    if (values.category !== "fuel") return false;
    if (!isEdit && applied?.shape === "pair") return false;
    if (showEmptyReturnCheckbox) return values.isEmptyReturn === true;
    return applied?.shape === "return";
  };

  const buildPayload = (values: TripExpenseFormValues): TripExpenseFormValues => ({
    ...values,
    id: values.id,
    currency: values.currency ?? "MXN",
    description: values.description.trim(),
    vendorName: values.vendorName?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
    isEmptyReturn: resolveEmptyReturn(values),
  });

  const buildReturnCompanion = (
    base: TripExpenseFormValues,
    portion: FuelPortionQuote,
  ): TripExpenseFormValues => ({
    category: "fuel",
    description: copy.format.dieselEmptyReturnDescription,
    amount: portion.amount,
    currency: base.currency ?? "MXN",
    paymentSource: base.paymentSource,
    vendorName: base.vendorName,
    notes: copy.format.dieselNotes(portion.litersDisplay, dieselPricePerLiter),
    isEmptyReturn: true,
  });

  const submitValues = (
    values: TripExpenseFormValues,
    index: number | null,
    options?: { keepOpen?: boolean },
  ) => {
    const payload = buildPayload(values);
    const companion =
      !isEdit && applied?.shape === "pair"
        ? buildReturnCompanion(
            { ...payload, isEmptyReturn: false },
            applied.emptyReturn,
          )
        : undefined;
    if (companion) payload.isEmptyReturn = false;
    return onSubmit(payload, index, { ...options, companion });
  };

  const submitSheet = handleSubmit(
    (values) => {
      void submitValues(values, editingIndex);
    },
    () => {
      setShowSummary(true);
    },
  );

  const resetEmptyReturnAssist = () => {
    setScope("route");
    setReturnKm("");
    setApplied(null);
    setDistanceDialogOpen(false);
    setDieselPricePerLiter(DEFAULT_DIESEL_PRICE);
  };

  const handleAddAnother = () => {
    void handleSubmit(
      async (values) => {
        const result = buildPayload(values);
        const saved = await submitValues(values, null, { keepOpen: true });
        if (saved === false) return;
        reset(buildEmptyExpense(expenseKind));
        resetEmptyReturnAssist();
        setExtrasOpen(false);
        setShowSummary(false);
        const companionDescription =
          !isEdit && applied?.shape === "pair"
            ? copy.format.dieselEmptyReturnDescription
            : null;
        showSuccessToast(
          copy.toast.addedTitle,
          companionDescription
            ? copy.toast.addedPairBody(result.description, companionDescription)
            : copy.toast.addedBody(result.description),
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
  const hasExtras =
    Boolean(vendorName?.trim()) || Boolean(notesValue?.trim());

  // Sheet no-modal: el Dialog cuenta como "fuera" y cerraría el sheet (mismo
  // patrón que TripFleetAssignmentSheet).
  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && distanceDialogOpen) return;
    onOpenChange(nextOpen);
  };

  const preventSheetDismissWhileDialogOpen = (
    event: CustomEvent<{ originalEvent: Event }>,
  ) => {
    if (distanceDialogOpen) {
      event.preventDefault();
    }
  };

  return (
    <>
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
    <SheetContent
      side="right"
      className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      onInteractOutside={preventSheetDismissWhileDialogOpen}
      onPointerDownOutside={preventSheetDismissWhileDialogOpen}
      onFocusOutside={preventSheetDismissWhileDialogOpen}
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
        {notice}
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
              {!isEdit ? (
                <div
                  role="radiogroup"
                  aria-label={copy.emptyReturn.scopeLegend}
                  className="space-y-2"
                >
                  {EMPTY_RETURN_SCOPES.map((option) => {
                    const selected = scope === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={cn(
                          "flex w-full items-center rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          selected
                            ? "border-primary bg-primary/5 font-medium"
                            : "border-border hover:bg-muted/50",
                        )}
                        onClick={() => {
                          setScope(option.value);
                          setApplied(null);
                          if (option.value === "route") {
                            setValue("isEmptyReturn", false, { shouldDirty: true });
                          }
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {isEdit && !editingReturn ? (
                <p className="text-xs text-muted-foreground">
                  {copy.emptyReturn.routeEditHint}
                </p>
              ) : null}
              {!isEdit && scope === "both" && hasUnmarkedRouteFuel ? (
                <p className="text-sm text-info-soft-foreground">
                  {copy.emptyReturn.alreadyHasRouteFuel}
                </p>
              ) : null}
              {activeScope !== "return" && expectedFuelEfficiency ? (
                <p className="text-xs text-muted-foreground">
                  {copy.format.dieselHelpBody(
                    totalDistanceKm,
                    expectedFuelEfficiency,
                  )}
                </p>
              ) : null}
              {activeScope !== "return" ? (
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
                      {fuelQuote.route ? `${fuelQuote.route.litersDisplay} L` : "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
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
                      {fuelQuote.emptyReturn
                        ? `${fuelQuote.emptyReturn.litersDisplay} L`
                        : "—"}
                    </p>
                  </div>
                </div>
              )}
              {showReturnKm ? (
                <div className="space-y-1">
                  <Label htmlFor="empty-return-km" className="text-xs">
                    {copy.emptyReturn.returnKm}
                  </Label>
                  <Input
                    id="empty-return-km"
                    inputMode="decimal"
                    className="h-8 text-sm"
                    error={returnKmMissing}
                    value={returnKm}
                    onChange={(event) => {
                      setReturnKm(event.target.value);
                      setApplied(null);
                    }}
                    {...getFieldErrorAriaProps("empty-return-km", returnKmError)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {copy.emptyReturn.returnKmHelp}
                  </p>
                  <FieldInlineError
                    fieldId="empty-return-km"
                    message={returnKmError}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setDistanceDialogOpen(true)}
                  >
                    {copy.emptyReturn.useRouteDistance}
                  </Button>
                </div>
              ) : null}
              {saveShape === "pair" &&
              fuelQuote.route &&
              fuelQuote.emptyReturn ? (
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {copy.emptyReturn.amountRoute}
                    </p>
                    <p className="font-medium">
                      {formatMxCurrency(fuelQuote.route.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {copy.emptyReturn.amountReturn}
                    </p>
                    <p className="font-medium">
                      {formatMxCurrency(fuelQuote.emptyReturn.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {copy.emptyReturn.amountTotal}
                    </p>
                    <p className="font-medium">
                      {formatMxCurrency(fuelQuote.total)}
                    </p>
                  </div>
                </div>
              ) : null}
              {applied?.shape === "pair" ? (
                <p className="text-xs text-muted-foreground">
                  {copy.emptyReturn.pairArmedHint}
                </p>
              ) : null}
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-44 space-y-1">
                  <Label className="text-xs">{copy.label.dieselPrice}</Label>
                  <MoneyInput
                    id="diesel-price-per-liter"
                    className="h-8 text-sm"
                    value={dieselPricePerLiter}
                    onValueChange={(next) => {
                      setDieselPricePerLiter(next ?? DEFAULT_DIESEL_PRICE);
                      setApplied(null);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-xs text-muted-foreground">
                    {saveShape === "pair"
                      ? copy.emptyReturn.amountTotal
                      : saveShape === "return"
                        ? copy.emptyReturn.amountReturn
                        : copy.label.estimatedCost}
                  </p>
                  <p className="text-lg font-bold text-info-soft-foreground">
                    {saveShape === "return"
                      ? fuelQuote.emptyReturn
                        ? formatMxCurrency(fuelQuote.emptyReturn.amount)
                        : "—"
                      : saveShape === "pair" && fuelQuote.emptyReturn
                        ? formatMxCurrency(fuelQuote.total)
                        : fuelQuote.route
                          ? formatMxCurrency(fuelQuote.route.amount)
                          : "—"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={applyDieselSuggestion}
                  disabled={!canApplyEstimate}
                >
                  <Fuel className="mr-1 h-3.5 w-3.5" />
                  {copy.action.useEstimate}
                </Button>
              </div>
            </div>
          ) : null}
          {showEmptyReturnCheckbox ? (
            <Controller
              control={control}
              name="isEmptyReturn"
              render={({ field }) => (
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="expense-empty-return"
                      checked={field.value === true}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                    <Label
                      htmlFor="expense-empty-return"
                      className="text-sm font-normal leading-snug"
                    >
                      {copy.emptyReturn.checkbox}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {copy.emptyReturn.checkboxHelp}
                  </p>
                </div>
              )}
            />
          ) : null}
        </FormSectionCard>

        <FormSectionCard
          title={psCopy.sectionTitle}
          icon={<Wallet className="h-4 w-4" />}
          contentClassName="space-y-3"
        >
          <Controller
            control={control}
            name="paymentSource"
            render={({ field }) => (
              <div
                id="expense-payment-source"
                role="radiogroup"
                aria-label={psCopy.sectionTitle}
                {...getFieldErrorAriaProps(
                  "expense-payment-source",
                  paymentSourceError,
                )}
                className="space-y-2"
              >
                {PAYMENT_SOURCE_OPTIONS.map((opt) => {
                  const selected = field.value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/5 font-medium"
                          : "border-border hover:bg-muted/50",
                        paymentSourceError && !selected && "border-destructive/50",
                      )}
                      onClick={() => field.onChange(opt.value)}
                    >
                      <span className="text-base" aria-hidden>
                        {opt.emoji}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          <FieldInlineError
            fieldId="expense-payment-source"
            message={paymentSourceError}
          />
          <p className="text-xs text-muted-foreground">
            {paymentSource
              ? PAYMENT_SOURCE_HINTS[paymentSource]
              : psCopy.hintUnset}
          </p>
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
          disabled={isSubmitting}
        >
          {copy.action.cancel}
        </Button>
        {!isEdit ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddAnother}
            disabled={isSubmitting}
          >
            {copy.action.addAnother}
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={() => void submitSheet()}
          disabled={isSubmitting}
        >
          {isEdit
            ? (submitLabel ?? copy.action.saveChanges)
            : applied?.shape === "pair"
              ? copy.action.addTwoConcepts
              : copy.action.addConcept}
        </Button>
      </SheetFooter>
    </SheetContent>
    </Sheet>
    <Dialog open={distanceDialogOpen} onOpenChange={setDistanceDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.emptyReturn.useRouteDistanceTitle}</DialogTitle>
          <DialogDescription>
            {copy.emptyReturn.useRouteDistanceBody}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDistanceDialogOpen(false)}
          >
            {copy.action.cancel}
          </Button>
          <Button type="button" onClick={confirmRouteDistance}>
            {copy.emptyReturn.useRouteDistanceConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
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
  const sessionKey = `${editingIndex ?? "new"}-${expenseKind}-${initialValues?.category ?? ""}-${initialValues?.description ?? ""}-${initialValues?.isEmptyReturn ? "er" : "rt"}`;

  if (!open) {
    return <Sheet open={false} onOpenChange={onOpenChange} />;
  }

  return (
    <TripExpenseSheetSession
      key={sessionKey}
      open={open}
      onOpenChange={onOpenChange}
      expenseKind={expenseKind}
      initialValues={initialValues}
      editingIndex={editingIndex}
      {...rest}
    />
  );
}
