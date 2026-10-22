import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  FormValidationSummary,
  RHFTextareaField,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { useResumeSubstitutionCancel } from "@features/invoicing/application";
import { useOverlayMutationFeedback, useToast } from "@shared/hooks";
import { invoicingCopy } from "../copy/invoicingCopy";
import { resolveCancelMutationError } from "../helpers/resolveCancelMutationError";

const sheetCopy = invoicingCopy.detail.substitute;

const schema = z.object({
  cancellationReason: z.string().min(1, "Motivo requerido").max(500),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Motivo previo (si el API ya lo guardó) o default de reintento. */
  defaultReason?: string | null;
}

export function ResumeSubstitutionCancelDialog({
  invoiceId,
  open,
  onOpenChange,
  defaultReason,
}: Props) {
  const { toast } = useToast();
  const [alertTitle, setAlertTitle] = useState<string>(sheetCopy.errorTitle);
  const { submissionError, showOverlayError, clearOverlayError } =
    useOverlayMutationFeedback({
      errorTitle: sheetCopy.errorTitle,
      seeInlineCopy: sheetCopy.errorSeeInline,
      toast,
    });
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      cancellationReason:
        defaultReason?.trim() || sheetCopy.resumeCancelDefaultReason,
    },
  });

  useEffect(() => {
    if (!open) return;
    clearOverlayError();
    setAlertTitle(sheetCopy.errorTitle);
    setShowValidationSummary(false);
    form.reset({
      cancellationReason:
        defaultReason?.trim() || sheetCopy.resumeCancelDefaultReason,
    });
  }, [open, defaultReason, clearOverlayError, form]);

  const { mutate, isPending } = useResumeSubstitutionCancel(invoiceId, {
    onSuccess: () => {
      toast({
        title: sheetCopy.resumeCancelSuccessTitle,
        description: sheetCopy.resumeCancelSuccessDescription,
      });
      onOpenChange(false);
    },
    onError: (err) => {
      const mapped = resolveCancelMutationError(err);
      setAlertTitle(mapped.title);
      showOverlayError(mapped.body);
    },
  });

  const handleSubmit = form.handleSubmit(
    (values) => {
      setShowValidationSummary(false);
      clearOverlayError();
      mutate({ cancellationReason: values.cancellationReason.trim() });
    },
    () => setShowValidationSummary(true),
  );

  const validationMessages = collectFieldErrorMessages(form.formState.errors);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{sheetCopy.resumeCancelDialogTitle}</DialogTitle>
          <DialogDescription>
            {sheetCopy.resumeCancelDialogDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submissionError ? (
            <Alert variant="destructive">
              <AlertTitle>{alertTitle}</AlertTitle>
              <AlertDescription className="select-text whitespace-pre-wrap break-words">
                {submissionError}
              </AlertDescription>
            </Alert>
          ) : null}

          {showValidationSummary && validationMessages.length > 0 ? (
            <FormValidationSummary
              title={sheetCopy.validationSummary}
              messages={validationMessages}
            />
          ) : null}

          <RHFTextareaField
            control={form.control}
            name="cancellationReason"
            label={sheetCopy.resumeCancelReasonLabel}
            required
            placeholder={sheetCopy.resumeCancelReasonPlaceholder}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {sheetCopy.close}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? sheetCopy.resumeCancelProcessing
                : sheetCopy.resumeCancelConfirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
