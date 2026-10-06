import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  FieldInlineError,
  getFieldErrorAriaProps,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { AlertWithIcon } from "@shared/ui/alert";
import { useToast } from "@shared/hooks";
import {
  getErrorMessage,
  getValidationErrors,
} from "@shared/api/interceptors/error-handler";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { useSelfActionForbiddenHandler } from "@features/approvals/application";
import { approvalsCopy } from "@features/approvals/presentation";
import { useDisburseDriverAdvance } from "../../application/hooks/useAdvances";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  disburseAdvanceFormSchema,
  type DisburseAdvanceFormData,
} from "../validation/settlementSchemas";
import {
  DISBURSEMENT_METHOD_LABELS,
  type DisbursementMethod,
} from "../../domain/enums";
import type { DriverAdvance } from "../../domain/entities";

const copy = settlementsCopy;
const dialogCopy = settlementsCopy.actionDialogs.disburseAdvance;

interface DisburseAdvanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advance: DriverAdvance;
  onSuccess?: () => void;
  /** ADR-0098: quien pidió el anticipo registra su propia entrega. */
  selfConfirm?: boolean;
}

function isInvalidPayloadError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "INVALID_PAYLOAD"
  );
}

export function DisburseAdvanceDialog({
  open,
  onOpenChange,
  advance,
  onSuccess,
  selfConfirm = false,
}: DisburseAdvanceDialogProps) {
  const { toast } = useToast();
  const disburseMutation = useDisburseDriverAdvance();
  const handleSelfActionForbidden = useSelfActionForbiddenHandler();
  const [apiError, setApiError] = useState<string | null>(null);

  const authorizedMethod: DisbursementMethod =
    advance.authorizedPaymentMethod ?? advance.paymentMethod;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    trigger,
    getFieldState,
    formState: { errors, isSubmitting },
  } = useForm<DisburseAdvanceFormData>({
    resolver: zodResolver(disburseAdvanceFormSchema),
    mode: "onTouched",
    defaultValues: { paymentMethod: authorizedMethod, bankReference: "" },
  });

  useEffect(() => {
    if (open) reset({ paymentMethod: authorizedMethod, bankReference: "" });
  }, [open, authorizedMethod, reset]);

  const selectedMethod = useWatch({ control, name: "paymentMethod" });
  const bankReference = useWatch({ control, name: "bankReference" });
  const requiresReference = selectedMethod !== "cash";
  const canSubmit = disburseAdvanceFormSchema.safeParse({
    paymentMethod: selectedMethod,
    bankReference,
  }).success;
  const isPending = isSubmitting || disburseMutation.isPending;

  const methodDiffers = selectedMethod !== authorizedMethod;
  const authorizedLabel = DISBURSEMENT_METHOD_LABELS[authorizedMethod] ?? authorizedMethod;
  const isChangeToCash = methodDiffers && selectedMethod === "cash";

  const handleMethodChange = (value: string) => {
    setValue("paymentMethod", value as DisbursementMethod, { shouldDirty: true });
    const refState = getFieldState("bankReference");
    if (refState.isTouched || refState.isDirty) void trigger("bankReference");
  };

  const describeError = (error: unknown): string => {
    const forbidden = handleSelfActionForbidden(error);
    if (forbidden) return forbidden.message ?? copy.toasts.selfDisburseRejected;
    if (isInvalidPayloadError(error)) {
      const detail = getValidationErrors(error)[0]?.message;
      return detail ? `${dialogCopy.invalidPayload} ${detail}` : dialogCopy.invalidPayload;
    }
    return getErrorMessage(error);
  };

  const onSubmit = async (data: DisburseAdvanceFormData) => {
    setApiError(null);
    try {
      await disburseMutation.mutateAsync({
        id: advance.id,
        payload: {
          paymentMethod: data.paymentMethod,
          bankReference: data.bankReference || undefined,
        },
      });
      toast({
        title: copy.toasts.disburseAdvanceSuccess,
        variant: "success",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message = describeError(error);
      setApiError(message);
      toast({
        title: copy.toasts.disburseAdvanceError,
        description: message,
        variant: "destructive",
      });
    }
  };

  const refMessage = errors.bankReference?.message;

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    if (!next) setApiError(null);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>
            {selfConfirm
              ? approvalsCopy.selfApproval.confirmDisburseTitle
              : dialogCopy.title}
          </DialogTitle>
          <DialogDescription>
            {dialogCopy.descriptionPart1}{" "}
            <span className="font-semibold text-primary">{formatMxCurrency(advance.amount)}</span>{" "}
            {dialogCopy.descriptionPart2}{" "}
            <span className="font-semibold text-foreground">{advance.employeeFullName ?? "—"}</span>.
          </DialogDescription>
        </DialogHeader>

        {selfConfirm && (
          <AlertWithIcon variant="warning">
            {approvalsCopy.selfApproval.confirmDisburseBody("advance")}
          </AlertWithIcon>
        )}

        {apiError && (
          <AlertWithIcon variant="destructive" title={dialogCopy.errorAlertTitle}>
            {apiError}
          </AlertWithIcon>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 py-2 text-sm">
          <div className="space-y-1">
            <Label htmlFor="disburse-adv-method">{dialogCopy.paymentMethodLabel}</Label>
            <Select value={selectedMethod} disabled={isPending} onValueChange={handleMethodChange}>
              <SelectTrigger
                id="disburse-adv-method"
                error={Boolean(errors.paymentMethod)}
                {...getFieldErrorAriaProps("disburse-adv-method", errors.paymentMethod?.message)}
              >
                <SelectValue placeholder={dialogCopy.paymentMethodPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DISBURSEMENT_METHOD_LABELS) as DisbursementMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {DISBURSEMENT_METHOD_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldInlineError
              fieldId="disburse-adv-method"
              message={errors.paymentMethod?.message}
            />
          </div>

          {methodDiffers && (
            <AlertWithIcon variant="warning">
              {isChangeToCash
                ? dialogCopy.methodChangedToCash(authorizedLabel)
                : dialogCopy.methodDiffersFromAuthorized(authorizedLabel)}{" "}
              {dialogCopy.methodChangeAudit}
            </AlertWithIcon>
          )}

          <div className="space-y-1">
            <Label htmlFor="disburse-bank-ref">
              {requiresReference ? `${dialogCopy.bankRefLabel} *` : dialogCopy.bankRefLabel}
            </Label>
            <Input
              id="disburse-bank-ref"
              disabled={isPending}
              placeholder={dialogCopy.bankRefPlaceholder}
              {...register("bankReference")}
              {...getRegisterFieldErrorProps("disburse-bank-ref", refMessage)}
            />
            {!requiresReference && !refMessage && (
              <p className="text-xs text-muted-foreground">{dialogCopy.bankRefOptionalHint}</p>
            )}
            <FieldInlineError fieldId="disburse-bank-ref" message={refMessage} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              {dialogCopy.cancel}
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {disburseMutation.isPending ? dialogCopy.pending : dialogCopy.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
