import { useMemo, useState } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";
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
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
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
import { EmployeeAsyncCombobox } from "@shared/ui/employee-async-combobox";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatDate } from "@shared/utils/dateUtils";
import { formatApprovalRole } from "@features/approvals/presentation";
import { ReturnedAlert } from "@features/approvals/presentation/components";
import type { DriverAdvance } from "../../domain/entities";
import {
  ADVANCE_CATEGORY_LABELS,
  DISBURSEMENT_METHOD_LABELS,
  type AdvanceCategory,
  type DisbursementMethod,
} from "../../domain/enums";
import {
  invalidateAdvanceQueries,
  useSubmitDriverAdvance,
  useUpdateDriverAdvance,
} from "../../application/hooks/useAdvances";
import {
  driverAdvanceEditSchema,
  type DriverAdvanceEditValues,
} from "../validation/settlementSchemas";
import {
  diffAdvanceEdit,
  isAdvanceStaleError,
  lastAdvanceSignature,
  type AdvanceEditDiff,
} from "../utils/advanceEditing";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  AdvanceTripSelect,
  resolveAdvanceTripLabel,
  type AdvanceTripOption,
} from "./AdvanceTripSelect";

const copy = settlementsCopy.advanceFlow;
const dialogCopy = settlementsCopy.advancesDialog;

export type AdvanceEditMode = "edit" | "correct";

export interface AdvanceEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advance: DriverAdvance;
  /** `correct` = devuelto: guarda y reenvía a autorización (D15). */
  mode?: AdvanceEditMode;
  onSaved?: () => void;
}

const CATEGORY_OPTIONS = Object.keys(ADVANCE_CATEGORY_LABELS) as AdvanceCategory[];
const METHOD_OPTIONS = Object.keys(DISBURSEMENT_METHOD_LABELS) as DisbursementMethod[];

function buildDefaults(advance: DriverAdvance): DriverAdvanceEditValues {
  return {
    employeeId: advance.employeeId,
    tripId: advance.tripId ?? "",
    amount: advance.amount,
    category: advance.category,
    paymentMethod: advance.paymentMethod,
    bankReference: advance.bankReference ?? "",
    notes: advance.notes ?? "",
  };
}

function collectMessages(errors: Record<string, { message?: unknown } | undefined>): string[] {
  const seen = new Set<string>();
  for (const key of Object.keys(errors)) {
    const message = errors[key]?.message;
    if (typeof message === "string" && message) seen.add(message);
  }
  return Array.from(seen);
}

function AdvanceEditSheetSession({
  onOpenChange,
  advance,
  mode = "edit",
  onSaved,
}: Omit<AdvanceEditSheetProps, "open">) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateDriverAdvance();
  const submitMutation = useSubmitDriverAdvance();
  const [stale, setStale] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [pendingDiff, setPendingDiff] = useState<AdvanceEditDiff | null>(null);

  const isDraft = advance.status === "draft";
  const isCorrect = mode === "correct";
  const isSaving = updateMutation.isPending || submitMutation.isPending;
  const signature = lastAdvanceSignature(advance);

  const form = useForm<DriverAdvanceEditValues>({
    resolver: zodResolver(driverAdvanceEditSchema) as Resolver<DriverAdvanceEditValues>,
    defaultValues: buildDefaults(advance),
    mode: "onSubmit",
  });
  const { control, handleSubmit, register, setValue, formState } = form;
  const category = useWatch({ control, name: "category" });
  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const employeeId = useWatch({ control, name: "employeeId" });
  const tripId = useWatch({ control, name: "tripId" }) ?? "";
  const errors = formState.errors;
  const currentTripOption = useMemo<AdvanceTripOption | null>(() => {
    if (!advance.tripId) return null;
    return {
      tripId: advance.tripId,
      tripCode: advance.tripCode ?? advance.tripId.slice(0, 8),
    };
  }, [advance.tripId, advance.tripCode]);
  const [selectedTripCode, setSelectedTripCode] = useState<string | null>(
    advance.tripCode ?? null,
  );
  const summaryMessages = useMemo(
    () => collectMessages(errors as Record<string, { message?: unknown } | undefined>),
    [errors],
  );

  const materialHint = isDraft
    ? null
    : signature && advance.status === "pending_disbursement"
      ? copy.editSheet.materialHintSigned(
          copy.editSheet.materialFields,
          signature.name,
          formatApprovalRole(signature.role),
          formatDate(signature.decidedAt),
        )
      : copy.editSheet.materialHintRestart(copy.editSheet.materialFields);

  const close = () => onOpenChange(false);

  const reloadAndClose = () => {
    invalidateAdvanceQueries(queryClient);
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

  const persist = async (diff: AdvanceEditDiff) => {
    setApiError(null);
    try {
      let effect = "none";
      if (diff.payload) {
        const result = await updateMutation.mutateAsync({ id: advance.id, payload: diff.payload });
        effect = result.approvalEffect;
      }
      if (isCorrect) {
        await submitMutation.mutateAsync(advance.id);
        toast({ title: copy.toasts.resubmitted, variant: "success" });
      } else if (diff.payload) {
        toastForEffect(effect);
      }
      setPendingDiff(null);
      onSaved?.();
      close();
    } catch (error) {
      setPendingDiff(null);
      if (isAdvanceStaleError(error)) {
        setStale(true);
        return;
      }
      setApiError(getErrorMessage(error));
    }
  };

  const onValid = (values: DriverAdvanceEditValues) => {
    setShowSummary(false);
    const labelOptions: AdvanceTripOption[] = [];
    if (currentTripOption) labelOptions.push(currentTripOption);
    if (values.tripId?.trim() && selectedTripCode) {
      labelOptions.push({ tripId: values.tripId.trim(), tripCode: selectedTripCode });
    }
    const diff = diffAdvanceEdit(advance, values, {
      trip: {
        from: resolveAdvanceTripLabel(advance.tripId, labelOptions, advance.tripCode),
        to: resolveAdvanceTripLabel(values.tripId, labelOptions, selectedTripCode),
      },
    });
    if (!diff.payload && !isCorrect) {
      close();
      return;
    }
    if (diff.requiresConfirmation) {
      setPendingDiff(diff);
      return;
    }
    void persist(diff);
  };

  const submit = handleSubmit(onValid, () => setShowSummary(true));

  const consequence = (() => {
    if (advance.status === "pending_disbursement") {
      return signature
        ? copy.confirmMaterial.authorizationLost(
            signature.name,
            formatApprovalRole(signature.role),
            formatDate(signature.decidedAt),
          )
        : copy.confirmMaterial.authorizationLostUnknown;
    }
    return copy.confirmMaterial.restart;
  })();
  const voidedSignatures =
    advance.status === "pending_approval"
      ? (advance.approval?.signedSteps ?? [])
          .map((step) => step.fullName?.trim())
          .filter((name): name is string => Boolean(name))
      : [];

  return (
    <SheetContent
      side="right"
      className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      onFocusOutside={(event) => event.preventDefault()}
    >
      <SheetHeader className="shrink-0 border-b px-6 py-4">
        <SheetTitle>
          {isCorrect
            ? copy.editSheet.correctTitle(advance.folio)
            : copy.editSheet.title(advance.folio)}
        </SheetTitle>
        <SheetDescription>{copy.editSheet.description}</SheetDescription>
      </SheetHeader>

      <form
        noValidate
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
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

          {isCorrect ? <ReturnedAlert approval={advance.approval} /> : null}

          {apiError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{copy.editSheet.saveErrorTitle}</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          ) : null}

          {isDraft ? (
            <Controller
              control={control}
              name="employeeId"
              render={({ field, fieldState }) => (
                <EmployeeAsyncCombobox
                  id="adv-edit-employee"
                  label={dialogCopy.employeeLabel}
                  value={field.value}
                  onChange={(nextEmployeeId) => {
                    setValue("employeeId", nextEmployeeId, { shouldValidate: true });
                    setValue("tripId", "", { shouldValidate: true });
                    setSelectedTripCode(null);
                  }}
                  placeholder={dialogCopy.employeePlaceholder}
                  error={fieldState.error?.message}
                />
              )}
            />
          ) : (
            <div className="space-y-1">
              <Label htmlFor="adv-edit-employee-ro">{copy.fieldLabels.employeeId}</Label>
              <Input
                id="adv-edit-employee-ro"
                value={advance.employeeFullName ?? advance.employeeId}
                readOnly
                disabled
                aria-describedby="adv-edit-employee-hint"
              />
              <p id="adv-edit-employee-hint" className="text-xs text-muted-foreground">
                {copy.editSheet.operatorHint}
              </p>
            </div>
          )}

          <Controller
            control={control}
            name="tripId"
            render={({ fieldState }) => (
              <AdvanceTripSelect
                id="adv-edit-trip"
                employeeId={employeeId}
                value={tripId}
                onChange={(nextTripId, meta) => {
                  setValue("tripId", nextTripId, { shouldValidate: true });
                  setSelectedTripCode(meta?.tripCode ?? null);
                }}
                disabled={isSaving}
                error={fieldState.error?.message}
                currentOption={currentTripOption}
              />
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="adv-edit-amount">{dialogCopy.amountLabel}</Label>
              <Controller
                control={control}
                name="amount"
                render={({ field, fieldState }) => (
                  <MoneyInput
                    id="adv-edit-amount"
                    name={field.name}
                    value={
                      typeof field.value === "number" && Number.isFinite(field.value)
                        ? field.value
                        : undefined
                    }
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    currencyCode="MXN"
                    decimals={2}
                    disabled={isSaving}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps("adv-edit-amount", fieldState.error?.message)}
                  />
                )}
              />
              <FieldInlineError
                fieldId="adv-edit-amount"
                message={errors.amount?.message as string | undefined}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="adv-edit-category">{dialogCopy.categoryLabel}</Label>
              <Select
                value={category}
                onValueChange={(value) =>
                  setValue("category", value as AdvanceCategory, { shouldValidate: true })
                }
                disabled={isSaving}
              >
                <SelectTrigger
                  id="adv-edit-category"
                  {...getFieldErrorAriaProps("adv-edit-category", errors.category?.message)}
                >
                  <SelectValue placeholder={dialogCopy.categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {ADVANCE_CATEGORY_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldInlineError fieldId="adv-edit-category" message={errors.category?.message} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="adv-edit-method">{dialogCopy.paymentMethodLabel}</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) =>
                setValue("paymentMethod", value as DisbursementMethod, { shouldValidate: true })
              }
              disabled={isSaving}
            >
              <SelectTrigger
                id="adv-edit-method"
                {...getFieldErrorAriaProps("adv-edit-method", errors.paymentMethod?.message)}
              >
                <SelectValue placeholder={dialogCopy.paymentMethodPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {DISBURSEMENT_METHOD_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldInlineError fieldId="adv-edit-method" message={errors.paymentMethod?.message} />
          </div>

          {materialHint ? (
            <p className="text-xs text-muted-foreground" data-testid="advance-material-hint">
              {materialHint}
            </p>
          ) : null}

          <div className="space-y-1">
            <Label htmlFor="adv-edit-ref">{dialogCopy.bankReferenceLabel}</Label>
            <Input
              id="adv-edit-ref"
              placeholder={dialogCopy.bankReferencePlaceholder}
              disabled={isSaving}
              {...register("bankReference")}
              {...getRegisterFieldErrorProps("adv-edit-ref", errors.bankReference?.message)}
            />
            <FieldInlineError fieldId="adv-edit-ref" message={errors.bankReference?.message} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="adv-edit-notes">{dialogCopy.notesLabel}</Label>
            <Textarea
              id="adv-edit-notes"
              rows={3}
              placeholder={dialogCopy.notesPlaceholder}
              disabled={isSaving}
              {...register("notes")}
              {...getRegisterFieldErrorProps("adv-edit-notes", errors.notes?.message)}
            />
            <FieldInlineError fieldId="adv-edit-notes" message={errors.notes?.message} />
          </div>

          {showSummary && summaryMessages.length > 0 ? (
            <FormValidationSummary
              title={copy.editSheet.validationTitle}
              messages={summaryMessages}
            />
          ) : null}
        </div>

        <SheetFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4">
          <Button type="button" variant="outline" onClick={close} disabled={isSaving}>
            {copy.editSheet.cancel}
          </Button>
          <Button type="submit" disabled={isSaving || stale}>
            {isSaving
              ? copy.editSheet.saving
              : isCorrect
                ? copy.editSheet.saveAndResubmit
                : copy.editSheet.save}
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
            <AlertDialogTitle>{copy.confirmMaterial.title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <ul className="space-y-0.5">
                  {pendingDiff?.changes.map((change) => (
                    <li key={change.field} className="tabular-nums">
                      {change.label}: {change.from} → {change.to}
                    </li>
                  ))}
                </ul>
                <p>{consequence}</p>
                {voidedSignatures.map((name) => (
                  <p key={name}>{copy.confirmMaterial.signatureVoided(name)}</p>
                ))}
                <p className="font-medium text-foreground">
                  {copy.confirmMaterial.requesterWarning}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>{copy.confirmMaterial.back}</AlertDialogCancel>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => {
                if (pendingDiff) void persist(pendingDiff);
              }}
            >
              {copy.confirmMaterial.confirm}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SheetContent>
  );
}

/** ADR-0099 D16–D18: edición de anticipo en Sheet; la guarda es `expected_status`. */
export function AdvanceEditSheet({ open, onOpenChange, advance, ...rest }: AdvanceEditSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {open ? (
        <AdvanceEditSheetSession
          key={advance.id}
          onOpenChange={onOpenChange}
          advance={advance}
          {...rest}
        />
      ) : null}
    </Sheet>
  );
}
