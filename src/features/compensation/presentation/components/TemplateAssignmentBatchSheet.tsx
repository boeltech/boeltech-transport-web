import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, AlertTriangle, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import { Checkbox } from "@shared/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { DateField, FieldInlineError, FormValidationSummary } from "@shared/ui/form";
import { Textarea } from "@shared/ui/text-area/textarea";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { formatDate, getTodayString } from "@shared/utils/dateUtils";
import { EmployeeAsyncCombobox } from "@shared/ui/employee-async-combobox";
import {
  isBatchPreviewPayloadReady,
  useBatchAssignmentPreview,
  useBatchCreateTemplateAssignments,
} from "../../application/hooks";
import {
  formatAssignEmployeeIds,
  parseAssignEmployeeIds,
  resolveBatchInitialEffectiveFrom,
} from "../../application/compensationRoutes";
import type {
  BatchAssignmentConflict,
  BatchAssignmentResult,
  BatchTemplateAssignmentPayload,
} from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import {
  batchAssignmentFormSchema,
  type BatchAssignmentFormData,
} from "../validation/compensationSchemas";
import {
  resolveBatchConflictView,
  type BatchConflictLink,
  type BatchConflictPrimaryAction,
} from "../utils/resolveBatchConflictView";
import { BatchAssignmentConflictRow } from "./BatchAssignmentConflictRow";

const copy = compensationCopy.sheet;
const batchCopy = compensationCopy.batchAssignment;
const BATCH_FORM_ID = "template-assignment-batch-form";

export interface BatchAssignmentFormSnapshot {
  employeeIds: string[];
  effectiveFrom: string;
}

interface TemplateAssignmentBatchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  initialEmployeeIds?: readonly string[];
  /** «Vigente desde» al abrir; si falta, inicio del período del pago u hoy. */
  initialEffectiveFrom?: string;
  /** Inicio del período del pago (YYYY-MM-DD) — default de vigencia. */
  paymentPeriodStart?: string;
  /** Fin del período del pago (YYYY-MM-DD) — para validar cobertura. */
  paymentPeriodEnd?: string;
  /** Al menos un operador quedó asignado (también en resultado parcial). */
  onAssignmentsCreated?: (result: BatchAssignmentResult) => void;
  /** Todos quedaron asignados; el sheet ya se cerró. */
  onSuccess?: () => void;
  /** Enlace a la asignación que bloquea (PRD D18); sin él, los renglones no lo muestran. */
  onOpenBlockingAssignment?: (
    link: BatchConflictLink,
    form: BatchAssignmentFormSnapshot,
  ) => void;
}

interface BatchOutcome {
  createdCount: number;
  total: number;
  conflicts: BatchAssignmentConflict[];
  effectiveFrom: string;
  /** Formulario tras dejar solo a los omitidos; mientras no cambie, la vista previa repetiría estos renglones. */
  formKey: string;
}

function batchFormKey(values: {
  employeeIds: readonly string[];
  effectiveFrom: string;
  effectiveTo?: string | null;
  closePreviousAssignment: boolean;
}): string {
  return JSON.stringify([
    values.employeeIds,
    values.effectiveFrom,
    values.effectiveTo?.trim() ?? "",
    values.closePreviousAssignment,
  ]);
}

export function TemplateAssignmentBatchSheet({
  open,
  onOpenChange,
  templateId,
  initialEmployeeIds,
  initialEffectiveFrom,
  paymentPeriodStart,
  paymentPeriodEnd,
  onAssignmentsCreated,
  onSuccess,
  onOpenBlockingAssignment,
}: TemplateAssignmentBatchSheetProps) {
  const { toast } = useToast();
  const batchMutation = useBatchCreateTemplateAssignments();
  const today = useMemo(() => getTodayString(), []);
  const startEffectiveFrom = resolveBatchInitialEffectiveFrom({
    assignFrom: initialEffectiveFrom,
    periodStart: paymentPeriodStart,
    today,
  });
  const initialIdsKey = formatAssignEmployeeIds(initialEmployeeIds ?? []);

  const form = useForm<BatchAssignmentFormData>({
    resolver: zodResolver(batchAssignmentFormSchema) as Resolver<BatchAssignmentFormData>,
    defaultValues: {
      employeeIds: [],
      effectiveFrom: startEffectiveFrom,
      effectiveTo: "",
      closePreviousAssignment: true,
      reason: "",
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (!open) return;
    reset({
      employeeIds: parseAssignEmployeeIds(initialIdsKey),
      effectiveFrom: startEffectiveFrom,
      effectiveTo: "",
      closePreviousAssignment: true,
      reason: "",
    });
  }, [open, initialIdsKey, reset, startEffectiveFrom]);

  const [outcome, setOutcome] = useState<BatchOutcome | null>(null);
  const [closureDetailOpen, setClosureDetailOpen] = useState(false);
  const sessionKey = open ? `${initialIdsKey}|${startEffectiveFrom}` : null;
  const [outcomeSessionKey, setOutcomeSessionKey] = useState(sessionKey);
  if (outcomeSessionKey !== sessionKey) {
    setOutcomeSessionKey(sessionKey);
    setOutcome(null);
    setClosureDetailOpen(false);
  }

  const watchedEmployeeIds = useWatch({ control, name: "employeeIds" });
  const employeeIds = useMemo(() => watchedEmployeeIds ?? [], [watchedEmployeeIds]);
  const effectiveFrom = useWatch({ control, name: "effectiveFrom" }) ?? startEffectiveFrom;
  const effectiveTo = useWatch({ control, name: "effectiveTo" });
  const closePreviousAssignment = useWatch({ control, name: "closePreviousAssignment" }) ?? true;

  const previewPayload = useMemo<BatchTemplateAssignmentPayload>(
    () => ({
      templateId,
      employeeIds,
      effectiveFrom,
      effectiveTo: effectiveTo?.trim() ? effectiveTo.trim() : null,
      closePreviousAssignment,
    }),
    [templateId, employeeIds, effectiveFrom, effectiveTo, closePreviousAssignment],
  );
  const preview = useBatchAssignmentPreview(previewPayload, { enabled: open });
  const currentFormKey = batchFormKey({
    employeeIds,
    effectiveFrom,
    effectiveTo,
    closePreviousAssignment,
  });
  const previewApplies =
    open &&
    isBatchPreviewPayloadReady(previewPayload) &&
    outcome?.formKey !== currentFormKey;
  const previewFailed = previewApplies && preview.isError;
  const previewData = previewApplies && !preview.isError ? preview.data : undefined;
  const previewConflicts = previewData?.conflicts ?? [];
  const previewClosures = previewData?.closures ?? [];

  const namesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const employee of previewData?.employees ?? []) {
      const name = employee.employeeFullName?.trim();
      if (name) map.set(employee.employeeId, name);
    }
    return map;
  }, [previewData]);

  const employeeName = (conflict: BatchAssignmentConflict): string =>
    conflict.employeeFullName?.trim() ||
    namesById.get(conflict.employeeId) ||
    batchCopy.unnamedOperator;

  const periodEnd = paymentPeriodEnd?.trim() || "";
  const periodStart = paymentPeriodStart?.trim() || "";
  const coverageMissesPaymentPeriod = Boolean(
    periodEnd && effectiveFrom && effectiveFrom > periodEnd,
  );

  const validationMessages = collectFieldErrorMessages(errors);

  const handlePrimaryAction = useCallback(
    (action: BatchConflictPrimaryAction) => {
      if (action.type === "assign-from") {
        setValue("employeeIds", [action.employeeId], { shouldValidate: true });
        setValue("effectiveFrom", action.effectiveFrom, { shouldValidate: true });
        return;
      }
      setValue("closePreviousAssignment", true);
    },
    [setValue],
  );

  /** Al cerrar por el enlace, el foco va a la fila resaltada (D20), no al botón que abrió el lote. */
  const skipCloseAutoFocusRef = useRef(false);

  const handleOpenLink = useMemo(
    () =>
      onOpenBlockingAssignment
        ? (link: BatchConflictLink) => {
            skipCloseAutoFocusRef.current = true;
            onOpenBlockingAssignment(link, {
              employeeIds: getValues("employeeIds"),
              effectiveFrom: getValues("effectiveFrom"),
            });
          }
        : undefined,
    [getValues, onOpenBlockingAssignment],
  );

  const renderConflictRows = (conflicts: BatchAssignmentConflict[], newEffectiveFrom: string) => (
    <ul className="mt-2 space-y-3">
      {conflicts.map((conflict) => (
        <BatchAssignmentConflictRow
          key={conflict.employeeId}
          conflict={conflict}
          view={resolveBatchConflictView(conflict, { templateId, newEffectiveFrom })}
          employeeName={employeeName(conflict)}
          onPrimaryAction={handlePrimaryAction}
          onOpenLink={handleOpenLink}
        />
      ))}
    </ul>
  );

  const onSubmit = handleSubmit(async (values) => {
    setOutcome(null);
    const effectiveToValue = values.effectiveTo?.trim() ? values.effectiveTo.trim() : null;
    try {
      const result = await batchMutation.mutateAsync({
        templateId,
        employeeIds: values.employeeIds,
        effectiveFrom: values.effectiveFrom,
        effectiveTo: effectiveToValue,
        closePreviousAssignment: values.closePreviousAssignment,
        reason: values.reason?.trim() ? values.reason.trim() : null,
      });

      if (result.createdCount > 0) onAssignmentsCreated?.(result);

      if (result.skippedCount === 0) {
        toast({ title: compensationCopy.toasts.batchSuccess, variant: "success" });
        onOpenChange(false);
        onSuccess?.();
        return;
      }

      const createdIds = new Set(result.created.map((assignment) => assignment.employeeId));
      const skippedIds = result.conflicts.length
        ? [...new Set(result.conflicts.map((conflict) => conflict.employeeId))]
        : values.employeeIds.filter((id) => !createdIds.has(id));
      setValue("employeeIds", skippedIds, { shouldValidate: true });

      const total = result.createdCount + result.skippedCount;
      setOutcome({
        createdCount: result.createdCount,
        total,
        conflicts: result.conflicts,
        effectiveFrom: values.effectiveFrom,
        formKey: batchFormKey({
          employeeIds: skippedIds,
          effectiveFrom: values.effectiveFrom,
          effectiveTo: effectiveToValue,
          closePreviousAssignment: values.closePreviousAssignment,
        }),
      });

      if (result.createdCount > 0) {
        toast({
          title: compensationCopy.toasts.batchPartial(result.createdCount, total),
          description: compensationCopy.toasts.batchPartialDescription,
          variant: "warning",
        });
      } else {
        toast({
          title: compensationCopy.toasts.batchNone,
          description: compensationCopy.toasts.batchNoneDescription,
          variant: "error",
        });
      }
    } catch (error) {
      toast({
        title: compensationCopy.toasts.batchError,
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col h-full bg-background"
        onFocusOutside={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => {
          if (!skipCloseAutoFocusRef.current) return;
          skipCloseAutoFocusRef.current = false;
          event.preventDefault();
        }}
      >
        <SheetHeader className="px-6 py-4 border-b bg-card shrink-0">
          <SheetTitle className="text-lg font-semibold text-foreground">{copy.batchTitle}</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {copy.batchDescription}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {outcome ? (
            <Alert
              variant={outcome.createdCount > 0 ? "warning" : "destructive"}
              className="mb-5 pr-10"
              data-testid="batch-assignment-result"
            >
              {outcome.createdCount > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {outcome.createdCount > 0
                  ? batchCopy.result.partialTitle(outcome.createdCount, outcome.total)
                  : batchCopy.result.noneTitle}
              </AlertTitle>
              <AlertDescription>
                <p>{batchCopy.result.description}</p>
                {renderConflictRows(outcome.conflicts, outcome.effectiveFrom)}
              </AlertDescription>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1"
                aria-label={batchCopy.result.dismiss}
                onClick={() => setOutcome(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Alert>
          ) : null}

          <form id={BATCH_FORM_ID} onSubmit={onSubmit} className="space-y-5">
            <Controller
              control={control}
              name="employeeIds"
              render={({ field, fieldState }) => (
                <EmployeeAsyncCombobox
                  mode="multi"
                  id="batch-employees"
                  label={copy.fields.operators}
                  value={field.value}
                  onChange={(ids) => setValue("employeeIds", ids, { shouldValidate: true })}
                  error={fieldState.error?.message}
                />
              )}
            />
            <FieldInlineError fieldId="batch-employees" message={errors.employeeIds?.message} />

            {periodStart && periodEnd ? (
              <p className="text-xs text-muted-foreground">
                {copy.coverageHint(formatDate(periodStart), formatDate(periodEnd))}
              </p>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="batch-from">{copy.fields.effectiveFrom}</Label>
                <Controller
                  control={control}
                  name="effectiveFrom"
                  render={({ field, fieldState }) => (
                    <DateField
                      id="batch-from"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={Boolean(fieldState.error)}
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="batch-to">{copy.fields.effectiveTo}</Label>
                <Controller
                  control={control}
                  name="effectiveTo"
                  render={({ field, fieldState }) => (
                    <DateField
                      id="batch-to"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={Boolean(fieldState.error)}
                    />
                  )}
                />
              </div>
            </div>
            <FieldInlineError fieldId="batch-to" message={errors.effectiveTo?.message} />

            {coverageMissesPaymentPeriod && periodStart && periodEnd ? (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{copy.coverageWarningTitle}</AlertTitle>
                <AlertDescription>
                  {copy.coverageWarningDescription(
                    formatDate(periodStart),
                    formatDate(periodEnd),
                  )}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="closePreviousAssignment"
                render={({ field }) => (
                  <Checkbox
                    id="close-previous"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                )}
              />
              <Label htmlFor="close-previous">{copy.fields.closePrevious}</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-reason">{copy.fields.reason}</Label>
              <Textarea id="batch-reason" rows={2} {...form.register("reason")} />
            </div>

            {previewFailed ? (
              <p className="text-xs text-muted-foreground" data-testid="batch-preview-unavailable">
                {batchCopy.preview.unavailable}
              </p>
            ) : null}

            {previewConflicts.length > 0 ? (
              <Alert variant="warning" data-testid="batch-preview-conflicts">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{batchCopy.preview.title}</AlertTitle>
                <AlertDescription>
                  {renderConflictRows(previewConflicts, effectiveFrom)}
                </AlertDescription>
              </Alert>
            ) : null}

            {previewClosures.length > 0 ? (
              <div className="space-y-1 text-sm" data-testid="batch-preview-closures">
                <p className="text-muted-foreground">
                  {batchCopy.preview.closures(
                    previewClosures.length,
                    formatDate(previewClosures[0].closeTo),
                  )}
                </p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-0"
                  aria-expanded={closureDetailOpen}
                  onClick={() => setClosureDetailOpen((value) => !value)}
                >
                  {closureDetailOpen ? batchCopy.preview.hideDetail : batchCopy.preview.showDetail}
                </Button>
                {closureDetailOpen ? (
                  <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
                    {previewClosures.map((closure) => (
                      <li key={closure.assignmentId}>
                        {batchCopy.preview.closureItem(
                          closure.employeeFullName?.trim() || batchCopy.unnamedOperator,
                          batchCopy.templateVersion(closure.templateName, closure.templateVersion),
                          formatDate(closure.effectiveFrom),
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {validationMessages.length > 0 ? (
              <FormValidationSummary
                title={copy.validationSummary}
                messages={validationMessages}
              />
            ) : null}
          </form>
        </div>

        <SheetFooter className="p-4 border-t bg-card shrink-0">
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              {copy.cancel}
            </Button>
            <Button
              type="submit"
              form={BATCH_FORM_ID}
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              {copy.confirmBatch}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
