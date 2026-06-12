import { useMemo, useState } from "react";
import { isValidSatRfc } from "@boeltech/cfdi-domain";
import { usePatchStopFiscal } from "@features/trips/application/hooks/usePatchStopFiscal";
import type {
  PatchTripStopFiscalResult,
  TripStop,
} from "@features/trips/domain";
import { getStopTypeConfig } from "@features/trips/presentation/uiHelpers";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { FieldInlineError } from "@shared/ui/form/FieldInlineError";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { tripFiscalCopy } from "../../copy/tripFiscalCopy";
import {
  buildFixSheetInitialValues,
  formatStopLocation,
} from "./tripFiscalHelpers";

const copy = tripFiscalCopy.fixSheet;
const MAX_REASON_LENGTH = 500;
const MIN_REASON_LENGTH = 5;
const MAX_NOMBRE_LENGTH = 300;

export interface FixStopRfcSheetProps {
  tripId: string;
  stop: TripStop;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: PatchTripStopFiscalResult) => void;
  submitLabel?: string;
}

type FixStopRfcSheetFormProps = {
  tripId: string;
  stop: TripStop;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: PatchTripStopFiscalResult) => void;
  submitLabel: string;
};

function FixStopRfcSheetForm({
  tripId,
  stop,
  onOpenChange,
  onSuccess,
  submitLabel,
}: FixStopRfcSheetFormProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canExecute = hasPermission("trips_stops_fiscal", "execute");

  const initial = buildFixSheetInitialValues(stop);
  const [rfc, setRfc] = useState(initial.rfc);
  const [nombre, setNombre] = useState(initial.nombre);
  const [reason, setReason] = useState("");
  const [propagate, setPropagate] = useState(false);
  const [rfcTouched, setRfcTouched] = useState(false);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const mutation = usePatchStopFiscal(tripId, stop.id, {
    onSuccess: (result) => {
      toast({
        variant: "success",
        title: copy.successTitle,
        description: result.clientUpdated
          ? copy.successClientUpdated
          : undefined,
      });
      onSuccess?.(result);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: tripFiscalCopy.stamp.errorTitle,
        description: getErrorMessage(error),
      });
    },
  });

  const normalizedRfc = rfc.trim().toUpperCase();
  const rfcValid = normalizedRfc.length > 0 && isValidSatRfc(normalizedRfc);
  const trimmedReasonLength = reason.trim().length;
  const reasonValid = trimmedReasonLength >= MIN_REASON_LENGTH;
  const canSubmit =
    canExecute && rfcValid && reasonValid && !mutation.isPending;

  const stopTypeLabel = (Array.isArray(stop.stopType)
    ? stop.stopType
    : [stop.stopType]
  )
    .map((type) => getStopTypeConfig(type).label)
    .join(" · ");

  const reasonDescribedBy = useMemo(() => {
    const ids = ["fix-stop-rfc-reason-counter"];
    if (reasonError) ids.push("fix-stop-rfc-reason-error");
    return ids.join(" ");
  }, [reasonError]);

  const handleSubmit = () => {
    if (!reasonValid) {
      setReasonError(copy.reasonTooShort);
      return;
    }
    setReasonError(null);
    mutation.mutate({
      rfcRemitenteDestinatario: normalizedRfc,
      nombreRemitenteDestinatario: nombre.trim() || undefined,
      reason: reason.trim(),
      propagateToClient: propagate,
    });
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{copy.title}</SheetTitle>
        <SheetDescription>
          {copy.description(
            stop.sequenceOrder,
            stopTypeLabel,
            formatStopLocation(stop),
          )}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4 py-4">
        {!canExecute ? (
          <p className="text-sm text-muted-foreground">{copy.noPermission}</p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="fix-stop-rfc">{copy.rfcLabel}</Label>
          <Input
            id="fix-stop-rfc"
            value={rfc}
            maxLength={13}
            className="font-mono uppercase"
            aria-invalid={rfcTouched && !rfcValid}
            onChange={(event) => {
              setRfc(event.target.value.toUpperCase());
              if (!rfcTouched) setRfcTouched(true);
            }}
            onBlur={() => setRfcTouched(true)}
          />
          {rfcTouched && !rfcValid ? (
            <FieldInlineError fieldId="fix-stop-rfc" message={copy.rfcInvalid} />
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fix-stop-nombre">{copy.nombreLabel}</Label>
          <Input
            id="fix-stop-nombre"
            value={nombre}
            maxLength={MAX_NOMBRE_LENGTH}
            onChange={(event) => setNombre(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="fix-stop-rfc-reason">{copy.reasonLabel}</Label>
            <span
              id="fix-stop-rfc-reason-counter"
              className="text-xs text-muted-foreground tabular-nums"
            >
              {copy.counter(trimmedReasonLength, MAX_REASON_LENGTH)}
            </span>
          </div>
          <Textarea
            id="fix-stop-rfc-reason"
            value={reason}
            aria-describedby={reasonDescribedBy}
            aria-invalid={Boolean(reasonError)}
            maxLength={MAX_REASON_LENGTH}
            onChange={(event) => {
              setReason(event.target.value.slice(0, MAX_REASON_LENGTH));
              if (reasonError) setReasonError(null);
            }}
            onBlur={() => {
              if (trimmedReasonLength > 0 && !reasonValid) {
                setReasonError(copy.reasonTooShort);
              }
            }}
          />
          {reasonError ? (
            <FieldInlineError
              fieldId="fix-stop-rfc-reason"
              message={reasonError}
            />
          ) : null}
        </div>

        {stop.clientAddressId ? (
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox
              id="fix-stop-propagate"
              checked={propagate}
              onCheckedChange={(checked) => setPropagate(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="fix-stop-propagate" className="font-normal">
                {copy.propagateLabel}
              </Label>
              <p className="text-xs text-muted-foreground">{copy.propagateHint}</p>
            </div>
          </div>
        ) : null}
      </div>

      <SheetFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={mutation.isPending}
        >
          {copy.cancel}
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
          {mutation.isPending ? "Guardando..." : submitLabel}
        </Button>
      </SheetFooter>
    </>
  );
}

export function FixStopRfcSheet({
  tripId,
  stop,
  open,
  onOpenChange,
  onSuccess,
  submitLabel = copy.submitStamp,
}: FixStopRfcSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {open ? (
          <FixStopRfcSheetForm
            key={stop.id}
            tripId={tripId}
            stop={stop}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
            submitLabel={submitLabel}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
