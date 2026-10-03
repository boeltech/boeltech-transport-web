import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { FieldInlineError } from "@shared/ui/form";
import { Label } from "@shared/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Textarea } from "@shared/ui/text-area";
import { cn } from "@shared/lib/utils/cn";
import {
  returnReasonCodesFor,
  type ApprovableItem,
  type ApprovableType,
  type ApprovalReturnReasonCode,
} from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";

export const DECISION_REASON_MIN_LENGTH = 5;
export const DECISION_REASON_MAX_LENGTH = 500;

export type DecisionReasonMode = "reject" | "return";

export interface DecisionReasonInput {
  reason: string;
  /** Solo en `return`; sin motivo rápido se envía `other`. */
  reasonCode?: ApprovalReturnReasonCode;
}

export interface DecisionReasonSheetProps {
  mode: DecisionReasonMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ApprovableItem | null;
  /** Masiva: mismo motivo para todos. */
  bulkItems?: ApprovableItem[];
  isSubmitting?: boolean;
  type?: ApprovableType;
  onSubmit: (input: DecisionReasonInput, items: ApprovableItem[]) => void;
}

const rejectCopy = approvalsCopy.rejectSheet;
const returnCopy = approvalsCopy.returnSheet;

function buildSchema(mode: DecisionReasonMode) {
  const texts = mode === "reject" ? rejectCopy : returnCopy;
  return z.object({
    reason: z
      .string()
      .trim()
      .min(DECISION_REASON_MIN_LENGTH, texts.reasonTooShort)
      .max(DECISION_REASON_MAX_LENGTH, texts.reasonTooLong),
    reasonCode: z
      .enum(["missing_receipt", "wrong_amount", "wrong_operator", "other"])
      .optional(),
  });
}

type DecisionReasonForm = z.infer<ReturnType<typeof buildSchema>>;

const REASON_CODE_LABELS = returnCopy.reasonCodes as Record<
  ApprovalReturnReasonCode,
  string
>;
const PREFILL_LABELS = new Set(Object.values(REASON_CODE_LABELS));

/**
 * ADR-0099 (handoff F6 D9): motivo de Rechazar (terminal) o Devolver para
 * corregir. 5–500 caracteres; en Devolver, un motivo rápido fija el código y
 * prellena el texto editable.
 */
export function DecisionReasonSheet({
  mode,
  open,
  onOpenChange,
  item,
  bulkItems,
  isSubmitting = false,
  type,
  onSubmit,
}: DecisionReasonSheetProps) {
  const targets = bulkItems?.length ? bulkItems : item ? [item] : [];
  const targetType = type || targets[0]?.approvableType || "trip_expense";
  const isBulk = (bulkItems?.length ?? 0) > 1;
  const isReturn = mode === "return";
  const fieldId = isReturn ? "return-request-reason" : "reject-expense-reason";
  const counterId = `${fieldId}-counter`;
  const reasonCodes = returnReasonCodesFor(targetType);

  const form = useForm<DecisionReasonForm>({
    resolver: zodResolver(buildSchema(mode)),
    defaultValues: { reason: "", reasonCode: undefined },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const { control, handleSubmit, reset, setValue, trigger, formState } = form;
  const reason = useWatch({ control, name: "reason" }) ?? "";
  const selectedCode = useWatch({ control, name: "reasonCode" });
  const trimmedLength = reason.trim().length;
  const reasonError = formState.errors.reason?.message;
  const canSubmit = trimmedLength >= DECISION_REASON_MIN_LENGTH && targets.length > 0;

  useEffect(() => {
    if (!open) reset({ reason: "", reasonCode: undefined });
  }, [open, reset]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset({ reason: "", reasonCode: undefined });
    onOpenChange(nextOpen);
  };

  const selectReasonCode = (code: ApprovalReturnReasonCode) => {
    setValue("reasonCode", code);
    const current = reason.trim();
    const isPrefill = current === "" || PREFILL_LABELS.has(current);
    if (!isPrefill) return;
    const next = code === "other" ? "" : REASON_CODE_LABELS[code];
    setValue("reason", next, { shouldValidate: next !== "" });
  };

  const submit = handleSubmit((values) => {
    onSubmit(
      {
        reason: values.reason.trim(),
        ...(isReturn ? { reasonCode: values.reasonCode ?? "other" } : {}),
      },
      targets,
    );
  });

  const title = isReturn
    ? isBulk
      ? returnCopy.titleBulk(targets.length, targetType)
      : returnCopy.title(targetType)
    : isBulk
      ? rejectCopy.titleBulk(targets.length, targetType)
      : rejectCopy.title(targetType);
  const description = isReturn
    ? returnCopy.description
    : isBulk
      ? rejectCopy.descriptionBulk(targets.length, targetType)
      : rejectCopy.description(targetType);
  const texts = isReturn ? returnCopy : rejectCopy;
  const describedBy = [counterId, reasonError ? `${fieldId}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg"
        onFocusOutside={(event) => event.preventDefault()}
      >
        <form
          noValidate
          className="flex h-full flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 py-4">
            {!isReturn ? (
              <AlertWithIcon variant="warning">{rejectCopy.terminalWarning}</AlertWithIcon>
            ) : null}

            {isReturn ? (
              <div className="space-y-2">
                <span className="text-sm font-medium" id={`${fieldId}-codes-label`}>
                  {returnCopy.reasonCodeLabel}
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby={`${fieldId}-codes-label`}
                  className="flex flex-wrap gap-2"
                >
                  {reasonCodes.map((code) => {
                    const active = selectedCode === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={isSubmitting}
                        onClick={() => selectReasonCode(code)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                          active
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-input text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {REASON_CODE_LABELS[code]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={fieldId}>{texts.reasonLabel}</Label>
                <span id={counterId} className="text-xs text-muted-foreground tabular-nums">
                  {rejectCopy.counter(trimmedLength, DECISION_REASON_MAX_LENGTH)}
                </span>
              </div>
              <Controller
                control={control}
                name="reason"
                render={({ field }) => (
                  <Textarea
                    id={fieldId}
                    ref={field.ref}
                    name={field.name}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(event.target.value.slice(0, DECISION_REASON_MAX_LENGTH))
                    }
                    onBlur={() => {
                      field.onBlur();
                      if (field.value.trim().length > 0) void trigger("reason");
                    }}
                    rows={5}
                    placeholder={texts.reasonPlaceholder}
                    disabled={isSubmitting}
                    error={Boolean(reasonError)}
                    aria-invalid={reasonError ? true : undefined}
                    aria-describedby={describedBy}
                  />
                )}
              />
              <FieldInlineError fieldId={fieldId} message={reasonError} />
            </div>
          </div>

          <SheetFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {texts.cancel}
            </Button>
            <Button
              type="submit"
              variant={isReturn ? "default" : "destructive"}
              disabled={!canSubmit || isSubmitting}
            >
              {texts.submit}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
