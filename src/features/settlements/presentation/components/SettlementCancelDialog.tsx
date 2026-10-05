import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
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
import type { DriverSettlement } from "../../domain/entities";
import {
  invalidateSettlementQueries,
  useCancelSettlement,
} from "../../application/hooks/useSettlements";
import {
  SETTLEMENT_CANCEL_REASON_MAX,
  SETTLEMENT_CANCEL_REASON_MIN,
} from "../validation/settlementSchemas";
import { isSettlementStaleError } from "../utils/settlementEditing";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.actionDialogs.cancelSettlement;
const toastCopy = settlementsCopy.toasts;
const FIELD_ID = "settlement-cancel-reason";
const CONFIRM_FIELD_ID = "settlement-cancel-confirm-not-delivered";

export interface SettlementCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: DriverSettlement;
  onCancelled?: () => void;
}

/**
 * Borrador = confirmación simple; pendiente o autorizado = motivo 5–500 que
 * queda en el historial de autorización. Errores del API se muestran dentro.
 */
export function SettlementCancelDialog({
  open,
  onOpenChange,
  settlement,
  onCancelled,
}: SettlementCancelDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cancelMutation = useCancelSettlement();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  // E11 (D4): en `approved` la cancelación exige confirmar que el pago no se entregó.
  const [confirmedNotDelivered, setConfirmedNotDelivered] = useState(false);

  const isDraft = settlement.status === "draft";
  const isApproved = settlement.status === "approved";

  const reset = () => {
    setReason("");
    setConfirmedNotDelivered(false);
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
    if (length < SETTLEMENT_CANCEL_REASON_MIN) return copy.reasonTooShort;
    if (length > SETTLEMENT_CANCEL_REASON_MAX) return copy.reasonTooLong;
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
        id: settlement.id,
        reason: isDraft ? undefined : reason.trim(),
        expectedStatus: settlement.status,
      });
      toast({ title: toastCopy.cancelSettlementSuccess, variant: "success" });
      onCancelled?.();
      reset();
      onOpenChange(false);
    } catch (err) {
      if (isSettlementStaleError(err)) invalidateSettlementQueries(queryClient, settlement.id);
      setApiError(getErrorMessage(err) || toastCopy.cancelSettlementError);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>
            {isDraft ? copy.draftTitle : copy.title(settlement.settlementNumber)}
          </DialogTitle>
          <DialogDescription>
            {isDraft ? copy.draftBody(settlement.settlementNumber) : copy.body}
          </DialogDescription>
        </DialogHeader>

        {apiError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        ) : null}

        {!isDraft ? (
          <div className="space-y-3 py-2">
            {isApproved ? (
              <>
                <Alert variant="destructive" data-testid="cancel-approved-warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{copy.approvedWarningTitle}</AlertTitle>
                  <AlertDescription>{copy.approvedWarning}</AlertDescription>
                </Alert>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id={CONFIRM_FIELD_ID}
                    checked={confirmedNotDelivered}
                    disabled={cancelMutation.isPending}
                    onCheckedChange={(checked) => setConfirmedNotDelivered(checked === true)}
                  />
                  <Label
                    htmlFor={CONFIRM_FIELD_ID}
                    className="text-xs font-normal leading-snug cursor-pointer"
                  >
                    {copy.approvedConfirmLabel}
                  </Label>
                </div>
              </>
            ) : (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{copy.pendingWarning}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1">
              <Label htmlFor={FIELD_ID}>{copy.reasonLabel}</Label>
              <Textarea
                id={FIELD_ID}
                rows={3}
                value={reason}
                placeholder={copy.reasonPlaceholder}
                maxLength={SETTLEMENT_CANCEL_REASON_MAX}
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
            {copy.cancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={cancelMutation.isPending || (isApproved && !confirmedNotDelivered)}
          >
            {cancelMutation.isPending ? copy.pending : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
