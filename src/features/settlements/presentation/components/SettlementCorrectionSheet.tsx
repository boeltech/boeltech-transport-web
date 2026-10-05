import { useMemo, useState } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Lock, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Textarea } from "@shared/ui/text-area/textarea";
import {
  FieldInlineError,
  FormValidationSummary,
  MoneyInput,
  getFieldErrorAriaProps,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { ReturnedAlert } from "@features/approvals";
import type { DriverSettlement } from "../../domain/entities";
import { calculatedBaseFromStored } from "../../domain/settlementTotals";
import {
  invalidateSettlementQueries,
  useSubmitSettlement,
  useUpdateSettlement,
} from "../../application/hooks/useSettlements";
import {
  useReimbursementSettlementPreview,
  useSettlementPreview,
} from "../../application/hooks/useSettlementPreview";
import {
  settlementCorrectionFormSchema,
  type SettlementCorrectionFormValues,
} from "../validation/settlementSchemas";
import {
  appliedAdvancesFromSettlement,
  assessCorrectionCapacity,
  canEditSettlementAdvances,
  computeCorrectionTotals,
  diffSettlementCorrection,
  isSettlementReturned,
  isSettlementStaleError,
  manualItemsFromSettlement,
  settlementTripOptions,
  type SettlementCorrectionDiff,
} from "../utils/settlementEditing";
import { ManualItemsEditor } from "./ManualItemsEditor";
import {
  toManualItemRows,
  type ManualItemRow,
  type ManualItemRowErrors,
} from "../utils/manualItemRows";
import {
  allocateAdvancesFifo,
  deductionCapacityErrors,
  deductionsExceedErrorsFromServer,
  parseDeductionsExceedGrossError,
  remainingAdvanceRoom,
  type DeductionCapacityErrors,
} from "../utils/settlementDeductionCapacity";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.settlementFlow;
const sheetCopy = copy.sheet;
const capCopy = copy.deductionsCap;
const ADVANCES_FIELD_ID = "settlement-correction-advances";
const MANUAL_ITEMS_FIELD_ID = "settlement-correction-manual-items";

type SaveIntent = "save" | "resubmit";

export interface SettlementCorrectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: DriverSettlement;
  /** D22.7: quien puede decidir ve la pista «Usa Devolver para corregir». */
  showAuthorizerHint?: boolean;
  onSaved?: () => void;
}

interface CorrectionFormState {
  customItems: ManualItemRow[];
  advancesToApply: { advanceId: string; amountToDeduct: number }[];
  notes: string;
}

interface AdvanceOption {
  advanceId: string;
  folio: string;
  /** Tope a descontar: saldo disponible o lo ya aplicado. */
  max: number;
  disbursedAt: string | null;
  /** Folio de otro pago que lo tiene reservado; no se puede descontar aquí. */
  reservedElsewhereBy: string | null;
}

function collectMessages(value: unknown, seen = new Set<string>()): string[] {
  if (!value || typeof value !== "object") return Array.from(seen);
  const record = value as Record<string, unknown>;
  if (typeof record.message === "string" && record.message) seen.add(record.message);
  for (const key of Object.keys(record)) {
    if (key === "ref" || key === "message" || key === "type") continue;
    collectMessages(record[key], seen);
  }
  return Array.from(seen);
}

function rowErrorsFrom(errors: unknown): ManualItemRowErrors[] | undefined {
  if (!Array.isArray(errors)) return undefined;
  return errors.map((row) => {
    if (!row || typeof row !== "object") return {};
    const fields = row as Record<string, { message?: string } | undefined>;
    return {
      itemType: fields.itemType?.message,
      description: fields.description?.message,
      amount: fields.amount?.message,
      isDeduction: fields.isDeduction?.message,
      tripId: fields.tripId?.message,
    };
  });
}

function SettlementCorrectionSheetSession({
  onOpenChange,
  settlement,
  showAuthorizerHint = false,
  onSaved,
}: Omit<SettlementCorrectionSheetProps, "open">) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateSettlement();
  const submitMutation = useSubmitSettlement();
  const [stale, setStale] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [pendingDiff, setPendingDiff] = useState<SettlementCorrectionDiff | null>(null);
  // 422 de tope de descuentos: vigente hasta que se editen anticipos o partidas.
  const [serverCapacityErrors, setServerCapacityErrors] = useState<{
    key: string;
    errors: DeductionCapacityErrors;
  } | null>(null);

  const isReturned = isSettlementReturned(settlement);
  const advancesEditable = canEditSettlementAdvances(settlement);
  const isSaving = updateMutation.isPending || submitMutation.isPending;
  const appliedAdvances = useMemo(() => appliedAdvancesFromSettlement(settlement), [settlement]);
  const tripOptions = useMemo(() => settlementTripOptions(settlement), [settlement]);
  const calculatedBase = useMemo(() => calculatedBaseFromStored(settlement), [settlement]);

  const isReimbursementOnly = settlement.settlementKind === "reimbursement_only";
  const regularPreview = useSettlementPreview(
    advancesEditable && !isReimbursementOnly
      ? {
          employeeId: settlement.employeeId,
          periodStart: settlement.periodStart,
          periodEnd: settlement.periodEnd,
        }
      : null,
  );
  // Un pago de reembolsos puede ser de un operador sin tarifa: su vista previa no lleva período.
  const reimbursementPreview = useReimbursementSettlementPreview(
    advancesEditable && isReimbursementOnly ? settlement.employeeId : null,
  );
  const preview = isReimbursementOnly ? reimbursementPreview : regularPreview;

  const advanceOptions = useMemo<AdvanceOption[]>(() => {
    const options = new Map<string, AdvanceOption>();
    for (const item of settlement.items ?? []) {
      if (item.itemType === "advance_deduction" && item.advanceId) {
        options.set(item.advanceId, {
          advanceId: item.advanceId,
          folio: item.calculationDetails?.advanceFolio ?? item.description,
          max: item.amount,
          disbursedAt: null,
          reservedElsewhereBy: null,
        });
      }
    }
    for (const open of preview.data?.openAdvances ?? []) {
      const available = open.availableBalance ?? open.balanceRemaining;
      const current = options.get(open.advanceId);
      // El preview no conoce este pago: su propia reserva también llega con folio.
      const reservedBy = open.reservedBySettlementNumber ?? null;
      options.set(open.advanceId, {
        advanceId: open.advanceId,
        folio: open.folio,
        max: Math.max(available, current?.max ?? 0),
        disbursedAt: open.disbursedAt ?? null,
        reservedElsewhereBy:
          !current && reservedBy && reservedBy !== settlement.settlementNumber ? reservedBy : null,
      });
    }
    return Array.from(options.values());
  }, [preview.data?.openAdvances, settlement.items, settlement.settlementNumber]);

  const form = useForm<CorrectionFormState>({
    resolver: zodResolver(settlementCorrectionFormSchema) as unknown as Resolver<CorrectionFormState>,
    defaultValues: {
      customItems: toManualItemRows(manualItemsFromSettlement(settlement)),
      advancesToApply: appliedAdvances,
      notes: settlement.notes ?? "",
    },
    mode: "onSubmit",
  });
  const { control, handleSubmit, register, formState } = form;
  const errors = formState.errors;
  const customItems = useWatch({ control, name: "customItems" });
  const advancesToApply = useWatch({ control, name: "advancesToApply" });

  const totals = computeCorrectionTotals(
    settlement,
    { customItems, advancesToApply },
    { advancesEditable },
  );
  const capacity = assessCorrectionCapacity(
    settlement,
    { customItems, advancesToApply },
    { advancesEditable },
  );
  // Un histórico con descuento no cubierto no se marca hasta que se toquen partidas o anticipos.
  const materialDirty = Boolean(
    formState.dirtyFields.customItems || formState.dirtyFields.advancesToApply,
  );
  const capacityInputsKey = JSON.stringify([customItems, advancesToApply]);
  const capacityErrors: DeductionCapacityErrors =
    serverCapacityErrors && serverCapacityErrors.key === capacityInputsKey
      ? serverCapacityErrors.errors
      : capacity && materialDirty
        ? deductionCapacityErrors(capacity, { advancesEditable })
        : {};
  const capacityMessages = [capacityErrors.advances, capacityErrors.manualItems].filter(
    (message): message is string => Boolean(message),
  );
  const summaryMessages = useMemo(() => collectMessages(errors), [errors]);
  const consequence =
    settlement.status === "draft"
      ? sheetCopy.consequence.draft
      : settlement.status === "pending_approval"
        ? sheetCopy.consequence.pending_approval
        : sheetCopy.consequence.approved;

  const close = () => onOpenChange(false);

  const reloadAndClose = () => {
    invalidateSettlementQueries(queryClient, settlement.id);
    close();
  };

  const toastForEffect = (effect: string) => {
    const title =
      effect === "flow_restarted"
        ? copy.toasts.flowRestarted
        : effect === "reapproval_required"
          ? copy.toasts.reapprovalRequired
          : copy.toasts.updated;
    toast({ title, variant: "success" });
  };

  const persist = async (diff: SettlementCorrectionDiff, intent: SaveIntent) => {
    setApiError(null);
    try {
      let effect = "none";
      if (diff.payload) {
        const result = await updateMutation.mutateAsync({
          id: settlement.id,
          payload: diff.payload,
        });
        effect = result.approvalEffect;
      }
      if (intent === "resubmit") {
        await submitMutation.mutateAsync(settlement.id);
        toast({ title: copy.toasts.resubmitted, variant: "success" });
      } else if (diff.payload) {
        toastForEffect(effect);
      }
      setPendingDiff(null);
      onSaved?.();
      close();
    } catch (error) {
      setPendingDiff(null);
      if (isSettlementStaleError(error)) {
        setStale(true);
        return;
      }
      const exceedsGross = parseDeductionsExceedGrossError(error);
      if (exceedsGross) {
        setServerCapacityErrors({
          key: capacityInputsKey,
          errors: deductionsExceedErrorsFromServer(exceedsGross, {
            useServerMessage: settlement.status !== "draft",
          }),
        });
        return;
      }
      setApiError(getErrorMessage(error));
    }
  };

  const onValid = (intent: SaveIntent) => (values: CorrectionFormState) => {
    setShowSummary(false);
    const diff = diffSettlementCorrection(
      settlement,
      values as unknown as SettlementCorrectionFormValues,
      { advancesEditable },
    );
    if (!diff.payload && intent === "save") {
      close();
      return;
    }
    if (diff.material && capacityMessages.length > 0) return;
    if (diff.requiresConfirmation) {
      setPendingDiff(diff);
      return;
    }
    void persist(diff, intent);
  };

  const submitWith = (intent: SaveIntent) =>
    handleSubmit(onValid(intent), () => setShowSummary(true));

  const maxAdvanceDeductible = capacity?.maxAdvanceDeductible ?? Number.POSITIVE_INFINITY;

  const toggleAdvance = (option: AdvanceOption, checked: boolean) => {
    const current = form.getValues("advancesToApply");
    const otherAdvancesTotal = current.reduce((sum, advance) => sum + advance.amountToDeduct, 0);
    const amountToDeduct = Number.isFinite(maxAdvanceDeductible)
      ? remainingAdvanceRoom({
          available: option.max,
          maxDeductible: maxAdvanceDeductible,
          otherAdvancesTotal,
        })
      : option.max;
    const next = checked
      ? [...current, { advanceId: option.advanceId, amountToDeduct }]
      : current.filter((advance) => advance.advanceId !== option.advanceId);
    form.setValue("advancesToApply", next, { shouldDirty: true });
  };

  const fitAdvancesToMax = () => {
    const selected = new Set(form.getValues("advancesToApply").map((advance) => advance.advanceId));
    const allocation = allocateAdvancesFifo(
      advanceOptions
        .filter((option) => selected.has(option.advanceId))
        .map((option) => ({
          advanceId: option.advanceId,
          available: option.max,
          disbursedAt: option.disbursedAt,
        })),
      maxAdvanceDeductible,
    );
    form.setValue(
      "advancesToApply",
      Object.entries(allocation).map(([advanceId, amountToDeduct]) => ({
        advanceId,
        amountToDeduct,
      })),
      { shouldDirty: true },
    );
  };

  const changeAdvanceAmount = (option: AdvanceOption, amount: number | undefined) => {
    const current = form.getValues("advancesToApply");
    const bounded = Math.min(amount ?? 0, option.max);
    form.setValue(
      "advancesToApply",
      current.map((advance) =>
        advance.advanceId === option.advanceId ? { ...advance, amountToDeduct: bounded } : advance,
      ),
      { shouldDirty: true },
    );
  };

  const appliedReadOnly = (settlement.items ?? []).filter(
    (item) => item.itemType === "advance_deduction",
  );
  const advancesLockedCopy = settlement.advancesDeductedAtCreate
    ? sheetCopy.advancesDeductedAtCreate
    : settlement.status === "draft"
      ? sheetCopy.advancesReserved
      : sheetCopy.advancesLockedHint;

  const primaryLabel = isReturned
    ? sheetCopy.saveAndResubmit
    : settlement.status === "draft"
      ? sheetCopy.save
      : sheetCopy.saveCorrection;
  const primaryIntent: SaveIntent = isReturned ? "resubmit" : "save";

  return (
    <SheetContent
      side="right"
      className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      onFocusOutside={(event) => event.preventDefault()}
    >
      <SheetHeader className="shrink-0 border-b px-6 py-4">
        <SheetTitle>{sheetCopy.title(settlement.settlementNumber)}</SheetTitle>
        <SheetDescription>{sheetCopy.description}</SheetDescription>
      </SheetHeader>

      <form
        noValidate
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void submitWith(primaryIntent)();
        }}
      >
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {stale ? (
            <Alert variant="warning" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{copy.staleAlert.title}</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{copy.staleAlert.body}</p>
                <p className="text-xs">{copy.staleAlert.lostChanges}</p>
                <Button type="button" size="sm" variant="outline" onClick={reloadAndClose}>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  {copy.staleAlert.action}
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {isReturned ? <ReturnedAlert approval={settlement.approval} /> : null}

          {apiError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{sheetCopy.saveErrorTitle}</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          ) : null}

          {showAuthorizerHint && settlement.status === "pending_approval" ? (
            <p className="text-xs text-muted-foreground">{sheetCopy.authorizerHint}</p>
          ) : null}

          <section
            className="space-y-2 rounded-md border bg-muted/30 p-4"
            aria-labelledby="settlement-correction-calculated"
          >
            <h3
              id="settlement-correction-calculated"
              className="flex items-center gap-1.5 text-sm font-semibold"
            >
              <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {sheetCopy.calculatedTitle}
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">{sheetCopy.operatorLabel}</dt>
              <dd className="font-medium">{settlement.employeeFullName || "—"}</dd>
              {isReimbursementOnly ? (
                <>
                  <dt className="text-muted-foreground">
                    {settlementsCopy.reimbursements.createPage.dialogKindLabel}
                  </dt>
                  <dd>{settlementsCopy.reimbursements.kindLabel}</dd>
                </>
              ) : (
                <>
                  <dt className="text-muted-foreground">{sheetCopy.periodLabel}</dt>
                  <dd>
                    {formatDate(settlement.periodStart)} – {formatDate(settlement.periodEnd)}
                  </dd>
                </>
              )}
              <dt className="text-muted-foreground">{sheetCopy.tripsLabel}</dt>
              <dd>{sheetCopy.tripsCount(settlement.tripsCount ?? tripOptions.length)}</dd>
              <dt className="text-muted-foreground">{sheetCopy.calculatedSubtotalLabel}</dt>
              <dd className="tabular-nums font-medium">
                {formatMxCurrency(calculatedBase.calculatedGross)}
              </dd>
            </dl>
            <p className="text-xs text-muted-foreground">{sheetCopy.calculatedHint}</p>
          </section>

          <section className="space-y-2" aria-labelledby="settlement-correction-manual">
            <div>
              <h3 id="settlement-correction-manual" className="text-sm font-semibold">
                {copy.manualItems.title}
              </h3>
              <p className="text-xs text-muted-foreground">{copy.manualItems.description}</p>
            </div>
            <Controller
              control={control}
              name="customItems"
              render={({ field }) => (
                <ManualItemsEditor
                  idPrefix="settlement-correction-item"
                  value={field.value}
                  onChange={field.onChange}
                  errors={rowErrorsFrom(errors.customItems)}
                  tripOptions={tripOptions}
                  disabled={isSaving || stale}
                />
              )}
            />
            <FieldInlineError fieldId={MANUAL_ITEMS_FIELD_ID} message={capacityErrors.manualItems} />
          </section>

          <section className="space-y-2" aria-labelledby="settlement-correction-advances">
            <h3 id="settlement-correction-advances" className="text-sm font-semibold">
              {sheetCopy.advancesTitle}
            </h3>
            {advancesEditable ? (
              <>
                <p className="text-xs text-muted-foreground">{sheetCopy.advancesDraftHint}</p>
                {preview.isLoading ? (
                  <p className="text-xs text-muted-foreground">{sheetCopy.advancesLoading}</p>
                ) : null}
                {preview.isError ? (
                  <p className="text-xs text-destructive">{sheetCopy.advancesLoadError}</p>
                ) : null}
                {advanceOptions.length === 0 && !preview.isLoading ? (
                  <p className="text-xs text-muted-foreground">{sheetCopy.advancesEmpty}</p>
                ) : null}
                <ul className="space-y-2">
                  {advanceOptions.map((option) => {
                    const applied = advancesToApply.find(
                      (advance) => advance.advanceId === option.advanceId,
                    );
                    const checkboxId = `settlement-correction-adv-${option.advanceId}`;
                    return (
                      <li
                        key={option.advanceId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Checkbox
                            id={checkboxId}
                            checked={Boolean(applied)}
                            onCheckedChange={(checked) => toggleAdvance(option, checked === true)}
                            disabled={isSaving || stale || (!applied && option.reservedElsewhereBy !== null)}
                          />
                          <Label htmlFor={checkboxId} className="text-sm font-mono">
                            {option.folio}
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            {sheetCopy.advanceBalance(formatMxCurrency(option.max))}
                          </span>
                          {option.reservedElsewhereBy ? (
                            <span
                              className="basis-full text-[11px] text-muted-foreground"
                              data-testid={`correction-advance-reserved-elsewhere-${option.advanceId}`}
                            >
                              {settlementsCopy.createPage.summary.reservedElsewhereHint(
                                option.reservedElsewhereBy,
                              )}
                            </span>
                          ) : null}
                        </div>
                        {applied ? (
                          <MoneyInput
                            className="w-36"
                            aria-label={sheetCopy.advanceAmountLabel(option.folio)}
                            value={applied.amountToDeduct}
                            onValueChange={(amount) => changeAdvanceAmount(option, amount)}
                            currencyCode="MXN"
                            decimals={2}
                            disabled={isSaving || stale}
                            error={Boolean(capacityErrors.advances)}
                            {...getFieldErrorAriaProps(ADVANCES_FIELD_ID, capacityErrors.advances)}
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                {capacity && advanceOptions.length > 0 ? (
                  <p
                    className="text-xs text-muted-foreground tabular-nums"
                    data-testid="settlement-correction-max-hint"
                  >
                    {capCopy.maxDeductibleHint(formatMxCurrency(capacity.maxAdvanceDeductible))}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                {appliedReadOnly.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{sheetCopy.advancesEmpty}</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {appliedReadOnly.map((item) => (
                      <li key={item.id} className="flex justify-between gap-2">
                        <span className="font-mono">
                          {item.calculationDetails?.advanceFolio ?? item.description}
                        </span>
                        <span className="tabular-nums text-destructive">
                          -{formatMxCurrency(item.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-muted-foreground" data-testid="settlement-advances-locked">
                  {advancesLockedCopy}
                </p>
              </>
            )}
            <FieldInlineError fieldId={ADVANCES_FIELD_ID} message={capacityErrors.advances} />
          </section>

          <section className="space-y-1">
            <Label htmlFor="settlement-correction-notes">{sheetCopy.notesTitle}</Label>
            <Textarea
              id="settlement-correction-notes"
              rows={3}
              placeholder={sheetCopy.notesPlaceholder}
              disabled={isSaving || stale}
              {...register("notes")}
              {...getRegisterFieldErrorProps(
                "settlement-correction-notes",
                errors.notes?.message,
              )}
            />
            <FieldInlineError
              fieldId="settlement-correction-notes"
              message={errors.notes?.message}
            />
          </section>

          <FormValidationSummary
            title={sheetCopy.validationTitle}
            messages={[...(showSummary ? summaryMessages : []), ...capacityMessages]}
          />
          {capacityErrors.advances && advancesEditable ? (
            <Button type="button" size="sm" variant="outline" onClick={fitAdvancesToMax}>
              {capCopy.fitMaxAction}
            </Button>
          ) : null}
        </div>

        <div className="shrink-0 space-y-1 border-t bg-muted/30 px-6 py-3 text-xs">
          <p className="font-medium tabular-nums" data-testid="settlement-correction-totals">
            {sheetCopy.footerTotals(
              formatMxCurrency(totals.before.perceptions),
              formatMxCurrency(totals.after.perceptions),
              formatMxCurrency(totals.before.deductions),
              formatMxCurrency(totals.after.deductions),
              formatMxCurrency(totals.before.net),
              formatMxCurrency(totals.after.net),
            )}
          </p>
          <p className="text-muted-foreground" data-testid="settlement-correction-consequence">
            {consequence}
          </p>
        </div>

        <SheetFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4">
          <Button type="button" variant="outline" onClick={close} disabled={isSaving}>
            {sheetCopy.cancel}
          </Button>
          {isReturned ? (
            <Button
              type="button"
              variant="outline"
              disabled={isSaving || stale}
              onClick={() => void submitWith("save")()}
            >
              {sheetCopy.saveDraft}
            </Button>
          ) : null}
          <Button type="submit" disabled={isSaving || stale}>
            {isSaving ? sheetCopy.saving : primaryLabel}
          </Button>
        </SheetFooter>
      </form>

      <AlertDialog
        open={pendingDiff != null}
        onOpenChange={(open) => {
          if (!open && !isSaving) setPendingDiff(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirm.title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <ul className="space-y-0.5">
                  {pendingDiff?.lines.map((line) => (
                    <li key={line} className="tabular-nums">
                      {line}
                    </li>
                  ))}
                  <li className="tabular-nums font-medium text-foreground">
                    {copy.confirm.netLine(
                      formatMxCurrency(totals.before.net),
                      formatMxCurrency(totals.after.net),
                    )}
                  </li>
                </ul>
                <p>{consequence}</p>
                <p className="font-medium text-foreground">{copy.confirm.requesterWarning}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>{copy.confirm.back}</AlertDialogCancel>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => {
                if (pendingDiff) void persist(pendingDiff, "save");
              }}
            >
              {copy.confirm.confirm}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SheetContent>
  );
}

/** ADR-0085 E10 / handoff 07 D21–D23: corrección en Sheet; la guarda es `expected_status`. */
export function SettlementCorrectionSheet({
  open,
  onOpenChange,
  settlement,
  ...rest
}: SettlementCorrectionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {open ? (
        <SettlementCorrectionSheetSession
          key={settlement.id}
          onOpenChange={onOpenChange}
          settlement={settlement}
          {...rest}
        />
      ) : null}
    </Sheet>
  );
}
