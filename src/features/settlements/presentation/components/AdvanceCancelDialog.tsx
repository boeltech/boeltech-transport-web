import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { FieldInlineError } from "@shared/ui/form";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import type { DriverAdvance } from "../../domain/entities";
import {
  invalidateAdvanceQueries,
  useCancelDriverAdvance,
} from "../../application/hooks/useAdvances";
import {
  ADVANCE_CANCEL_REASON_MAX,
  ADVANCE_CANCEL_REASON_MIN,
} from "../validation/settlementSchemas";
import { isAdvanceStaleError } from "../utils/advanceEditing";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.advanceFlow.cancelDialog;
const toastCopy = settlementsCopy.advanceFlow.toasts;
const FIELD_ID = "advance-cancel-reason";

export interface AdvanceCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advance: DriverAdvance;
  onCancelled?: () => void;
}

/**
 * ADR-0099 D20: borrador = confirmación simple; pedido o autorizado = motivo
 * 5–500. Un 400 `CANCELLATION_REASON_REQUIRED` se muestra dentro del diálogo.
 */
export function AdvanceCancelDialog({
  open,
  onOpenChange,
  advance,
  onCancelled,
}: AdvanceCancelDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cancelMutation = useCancelDriverAdvance();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const isDraft = advance.status === "draft";
  const isAuthorized = advance.status === "pending_disbursement";

  const reset = () => {
    setReason("");
    setError(null);
    setApiError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && cancelMutation.isPending) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const validate = (): string | null => {
    if (isDraft) return null;
    const length = reason.trim().length;
    if (length < ADVANCE_CANCEL_REASON_MIN) return copy.reasonTooShort;
    if (length > ADVANCE_CANCEL_REASON_MAX) return copy.reasonTooLong;
    return null;
  };

  const handleConfirm = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setApiError(null);
    try {
      await cancelMutation.mutateAsync({
        id: advance.id,
        reason: isDraft ? undefined : reason.trim(),
      });
      toast({ title: toastCopy.cancelled, variant: "success" });
      onCancelled?.();
      reset();
      onOpenChange(false);
    } catch (err) {
      if (isAdvanceStaleError(err)) invalidateAdvanceQueries(queryClient);
      setApiError(getErrorMessage(err) || toastCopy.cancelError);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{isDraft ? copy.draftTitle : copy.title(advance.folio)}</DialogTitle>
          <DialogDescription>{isDraft ? copy.draftBody : copy.body}</DialogDescription>
        </DialogHeader>

        {apiError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        ) : null}

        {!isDraft ? (
          <div className="space-y-3 py-2">
            {isAuthorized ? (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{copy.authorizedWarning}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-1">
              <Label htmlFor={FIELD_ID}>{copy.reasonLabel}</Label>
              <Textarea
                id={FIELD_ID}
                rows={3}
                value={reason}
                maxLength={ADVANCE_CANCEL_REASON_MAX}
                disabled={cancelMutation.isPending}
                error={Boolean(error)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${FIELD_ID}-error` : undefined}
                onChange={(event) => {
                  setReason(event.target.value);
                  if (error) setError(null);
                }}
              />
              <FieldInlineError fieldId={FIELD_ID} message={error ?? undefined} />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={cancelMutation.isPending}
          >
            {copy.back}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? copy.pending : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
