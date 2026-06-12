import { useMemo, useState } from "react";
import { isValidSatRfc } from "@boeltech/cfdi-domain";
import type { TripStop } from "@features/trips/domain";
import { getStopTypeConfig } from "@features/trips/presentation/uiHelpers";
import { tripFiscalCopy } from "@features/trips/presentation/copy/tripFiscalCopy";
import {
  buildFixSheetInitialValues,
  formatStopLocation,
} from "@features/trips/presentation/components/trip-fiscal/tripFiscalHelpers";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { FieldInlineError } from "@shared/ui/form/FieldInlineError";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import type { TripCorrectionFormEntry } from "../validation/substitutionCorrectionsSchema";

const copy = tripFiscalCopy.fixSheet;
const MAX_REASON_LENGTH = 500;
const MIN_REASON_LENGTH = 5;
const MAX_NOMBRE_LENGTH = 300;

export interface FixStopRfcDeferredFormProps {
  tripId: string;
  stop: TripStop;
  canExecute: boolean;
  submitLabel: string;
  onSave: (entry: TripCorrectionFormEntry) => void;
  onCancel: () => void;
}

export function FixStopRfcDeferredForm({
  tripId,
  stop,
  canExecute,
  submitLabel,
  onSave,
  onCancel,
}: FixStopRfcDeferredFormProps) {
  const initial = buildFixSheetInitialValues(stop);
  const [rfc, setRfc] = useState(initial.rfc);
  const [nombre, setNombre] = useState(initial.nombre);
  const [reason, setReason] = useState("");
  const [propagate, setPropagate] = useState(false);
  const [rfcTouched, setRfcTouched] = useState(false);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const normalizedRfc = rfc.trim().toUpperCase();
  const rfcValid = normalizedRfc.length > 0 && isValidSatRfc(normalizedRfc);
  const trimmedReasonLength = reason.trim().length;
  const reasonValid = trimmedReasonLength >= MIN_REASON_LENGTH;
  const canSubmit = canExecute && rfcValid && reasonValid;

  const stopTypeLabel = (Array.isArray(stop.stopType)
    ? stop.stopType
    : [stop.stopType]
  )
    .map((type) => getStopTypeConfig(type).label)
    .join(" · ");

  const reasonDescribedBy = useMemo(() => {
    const ids = ["substitute-stop-reason-counter"];
    if (reasonError) ids.push("substitute-stop-reason-error");
    return ids.join(" ");
  }, [reasonError]);

  const handleSubmit = () => {
    if (!reasonValid) {
      setReasonError(copy.reasonTooShort);
      return;
    }
    setReasonError(null);
    onSave({
      trip_id: tripId,
      stop_id: stop.id,
      rfc_remitente_destinatario: normalizedRfc,
      nombre_remitente_destinatario: nombre.trim() || undefined,
      reason: reason.trim(),
      propagate_to_client: propagate,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">
        {copy.description(
          stop.sequenceOrder,
          stopTypeLabel,
          formatStopLocation(stop),
        )}
      </p>

      {!canExecute ? (
        <p className="text-sm text-muted-foreground">{copy.noPermission}</p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`substitute-stop-rfc-${stop.id}`}>{copy.rfcLabel}</Label>
        <Input
          id={`substitute-stop-rfc-${stop.id}`}
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
          <FieldInlineError
            fieldId={`substitute-stop-rfc-${stop.id}`}
            message={copy.rfcInvalid}
          />
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`substitute-stop-nombre-${stop.id}`}>{copy.nombreLabel}</Label>
        <Input
          id={`substitute-stop-nombre-${stop.id}`}
          value={nombre}
          maxLength={MAX_NOMBRE_LENGTH}
          onChange={(event) => setNombre(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`substitute-stop-reason-${stop.id}`}>{copy.reasonLabel}</Label>
          <span
            id="substitute-stop-reason-counter"
            className="text-xs text-muted-foreground tabular-nums"
          >
            {copy.counter(trimmedReasonLength, MAX_REASON_LENGTH)}
          </span>
        </div>
        <Textarea
          id={`substitute-stop-reason-${stop.id}`}
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
            fieldId={`substitute-stop-reason-${stop.id}`}
            message={reasonError}
          />
        ) : null}
      </div>

      {stop.clientAddressId ? (
        <div className="flex items-start gap-3 rounded-lg border p-3">
          <Checkbox
            id={`substitute-stop-propagate-${stop.id}`}
            checked={propagate}
            onCheckedChange={(checked) => setPropagate(checked === true)}
          />
          <div className="space-y-1">
            <Label
              htmlFor={`substitute-stop-propagate-${stop.id}`}
              className="font-normal"
            >
              {copy.propagateLabel}
            </Label>
            <p className="text-xs text-muted-foreground">{copy.propagateHint}</p>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {copy.cancel}
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
