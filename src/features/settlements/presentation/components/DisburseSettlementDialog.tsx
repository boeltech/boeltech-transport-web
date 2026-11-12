import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { FieldInlineError, RHFDateTimeField } from "@shared/ui/form";
import { AlertWithIcon } from "@shared/ui/alert";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { useSelfActionForbiddenHandler } from "@features/approvals/application";
import { approvalsCopy } from "@features/approvals/presentation";
import { useQueryClient } from "@tanstack/react-query";
import {
  invalidateSettlementQueries,
  useDisburseSettlement,
} from "../../application/hooks/useSettlements";
import { settlementsCopy } from "../copy/settlementsCopy";
import { isSettlementRevisionChangedError } from "../utils/settlementEditing";
import { isDeductionsExceedGrossError } from "../utils/settlementDeductionCapacity";
import { parseExpenseAlreadyPaidError } from "../utils/settlementCreateConflicts";
import {
  disburseSettlementFormSchema,
  type DisburseSettlementFormData,
} from "../validation/settlementSchemas";
import {
  DISBURSEMENT_METHOD_LABELS,
  type DisbursementMethod,
} from "../../domain/enums";
import type { DriverSettlement } from "../../domain/entities";

const disburseCopy = settlementsCopy.settlementFlow.disburse;
const bulkCopy = settlementsCopy.workbench.bulkBar;

interface DisburseSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: DriverSettlement | null;
  onSuccess?: () => void;
  /** ADR-0098: quien armó el pago lo registra (único usuario que puede). */
  selfConfirm?: boolean;
  /**
   * HB-T5: solo boolean (nunca CLABE).
   * `false` → default efectivo; `true` / `undefined` → SPEI (legado).
   */
  hasClabe?: boolean;
}

function defaultDisbursedAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

/** D1: Sin CLABE → cash; con CLABE o desconocido → bank_transfer. */
function defaultDisbursementMethod(hasClabe?: boolean): DisbursementMethod {
  return hasClabe === false ? "cash" : "bank_transfer";
}

export function DisburseSettlementDialog({
  open,
  onOpenChange,
  settlement,
  onSuccess,
  selfConfirm = false,
  hasClabe,
}: DisburseSettlementDialogProps) {
  const { toast } = useToast();
  const disburseMutation = useDisburseSettlement();
  const handleSelfActionForbidden = useSelfActionForbiddenHandler();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<{ title: string; message: string } | null>(null);
  const [revisionChanged, setRevisionChanged] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DisburseSettlementFormData>({
    resolver: zodResolver(disburseSettlementFormSchema),
    defaultValues: {
      disbursementMethod: defaultDisbursementMethod(hasClabe),
      disbursementReference: "",
      disbursedAt: defaultDisbursedAtLocal(),
      notes: "",
    },
  });

  const selectedMethod = watch("disbursementMethod");
  const missingClabe = hasClabe === false;
  const showSpeiWithoutClabeWarn =
    missingClabe && selectedMethod === "bank_transfer";
  const descriptionPrefix =
    selectedMethod === "cash"
      ? disburseCopy.dialogDescriptionPrefixCash
      : disburseCopy.dialogDescriptionPrefix;
  const disbursedAtLabel =
    selectedMethod === "cash"
      ? disburseCopy.disbursedAtLabelCash
      : disburseCopy.disbursedAtLabel;

  useEffect(() => {
    if (open) {
      setApiError(null);
      setRevisionChanged(false);
      reset({
        disbursementMethod: defaultDisbursementMethod(hasClabe),
        disbursementReference: "",
        disbursedAt: defaultDisbursedAtLocal(),
        notes: "",
      });
    }
  }, [open, reset, hasClabe]);

  if (!settlement) return null;

  const isPending = isSubmitting || disburseMutation.isPending;

  const onSubmit = async (data: DisburseSettlementFormData) => {
    setApiError(null);
    const expectedRevision = settlement.approvalRevision;
    // D27: sin la revisión que vio el usuario no se registra; hay que recargar.
    if (!expectedRevision) {
      setRevisionChanged(true);
      return;
    }
    try {
      await disburseMutation.mutateAsync({
        id: settlement.id,
        data: {
          ...data,
          disbursedAt: localInputToUtcIso(data.disbursedAt),
        },
        expectedRevision,
      });
      toast({
        title: disburseCopy.successTitle,
        variant: "success",
      });
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // D27: otra persona corrigió el pago; no se registra ni se reintenta.
      if (isSettlementRevisionChangedError(error)) {
        setRevisionChanged(true);
        return;
      }
      if (isDeductionsExceedGrossError(error)) {
        setApiError({
          title: settlementsCopy.settlementFlow.deductionsCap.actionErrorTitle,
          message: getErrorMessage(error),
        });
        return;
      }
      const alreadyPaid = parseExpenseAlreadyPaidError(error);
      if (alreadyPaid) {
        const paidCopy = settlementsCopy.reimbursements.errors;
        setApiError({
          title: paidCopy.alreadyPaidTitle,
          message: alreadyPaid.settlementNumber
            ? paidCopy.alreadyPaidBody(alreadyPaid.settlementNumber)
            : paidCopy.alreadyPaidBodyNoFolio,
        });
        return;
      }
      const forbidden = handleSelfActionForbidden(error);
      const errorMsg = forbidden
        ? (forbidden.message ?? settlementsCopy.toasts.selfDisburseRejected)
        : getErrorMessage(error);
      // Dialog: error solo inline (sin toast duplicado).
      setApiError({ title: disburseCopy.errorAlertTitle, message: errorMsg });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) {
          onOpenChange(next);
        }
      }}
    >
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {selfConfirm
              ? approvalsCopy.selfApproval.confirmDisburseTitle
              : disburseCopy.title}
          </DialogTitle>
          <DialogDescription>
            {descriptionPrefix}{" "}
            <span className="font-semibold text-foreground">
              {settlement.settlementNumber}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {selfConfirm && (
          <AlertWithIcon variant="warning">
            {approvalsCopy.selfApproval.confirmDisburseBody("settlement")}
          </AlertWithIcon>
        )}

        {missingClabe ? (
          <p
            className="text-xs leading-snug text-muted-foreground"
            data-testid="disburse-no-clabe-tip"
          >
            {bulkCopy.noClabeCashRowTip}
            {" · "}
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs underline underline-offset-2"
              asChild
            >
              <Link
                to={`/employees/${settlement.employeeId}`}
                data-testid="disburse-complete-clabe-employees"
              >
                {bulkCopy.completeClabeInEmployees}
              </Link>
            </Button>
          </p>
        ) : null}

        {showSpeiWithoutClabeWarn ? (
          <AlertWithIcon
            variant="warning"
            data-testid="disburse-spei-without-clabe-warn"
          >
            {disburseCopy.noClabeSpeiWarning}
          </AlertWithIcon>
        ) : null}

        {apiError && (
          <AlertWithIcon variant="destructive" title={apiError.title}>
            {apiError.message}
          </AlertWithIcon>
        )}

        {revisionChanged && (
          <AlertWithIcon
            variant="warning"
            title={disburseCopy.revisionChangedTitle}
          >
            <p>{disburseCopy.revisionChanged}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                invalidateSettlementQueries(queryClient, settlement.id);
                onOpenChange(false);
              }}
            >
              {disburseCopy.reload}
            </Button>
          </AlertWithIcon>
        )}

        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{disburseCopy.operatorLabel}:</span>
            <span className="font-medium">{settlement.employeeFullName ?? "—"}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-muted-foreground">{disburseCopy.netAmountLabel}:</span>
            <span className="font-bold text-primary">
              {formatMxCurrency(settlement.netAmount)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="disb-method">{disburseCopy.methodLabel}</Label>
            <Select
              value={selectedMethod}
              disabled={isPending}
              onValueChange={(val) =>
                setValue("disbursementMethod", val as DisbursementMethod, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="disb-method">
                <SelectValue placeholder={disburseCopy.methodPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(DISBURSEMENT_METHOD_LABELS) as DisbursementMethod[]
                ).map((m) => (
                  <SelectItem key={m} value={m}>
                    {DISBURSEMENT_METHOD_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldInlineError fieldId="disb-method" message={errors.disbursementMethod?.message} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="disb-ref">{disburseCopy.referenceLabel}</Label>
            <Input
              id="disb-ref"
              disabled={isPending}
              placeholder={disburseCopy.referencePlaceholder}
              {...register("disbursementReference")}
            />
            {selectedMethod === "cash" && !errors.disbursementReference?.message ? (
              <p className="text-xs text-muted-foreground">
                {disburseCopy.referenceCashHint}
              </p>
            ) : null}
            <FieldInlineError fieldId="disb-ref" message={errors.disbursementReference?.message} />
          </div>

          <RHFDateTimeField
            control={control}
            name="disbursedAt"
            fieldId="disb-date"
            label={disbursedAtLabel}
            required
            disabled={isPending}
          />

          <div className="space-y-1">
            <Label htmlFor="disb-notes">{disburseCopy.notesLabel}</Label>
            <Textarea
              id="disb-notes"
              rows={2}
              disabled={isPending}
              placeholder={disburseCopy.notesPlaceholder}
              {...register("notes")}
            />
            <FieldInlineError fieldId="disb-notes" message={errors.notes?.message} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              {disburseCopy.cancel}
            </Button>
            <Button type="submit" disabled={isPending || revisionChanged}>
              {disburseMutation.isPending ? disburseCopy.pending : disburseCopy.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
