/* eslint-disable react-refresh/only-export-components */
import { isValidSatRfc } from "@boeltech/cfdi-domain";
import type { TripStop } from "@features/trips/domain";
import { usePermissions } from "@shared/permissions";
import { Checkbox } from "@shared/ui/checkbox";
import { FieldInlineError } from "@shared/ui/form/FieldInlineError";
import { getFieldErrorAriaProps } from "@shared/ui/form/fieldErrorAria";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { tripFiscalCopy } from "../../../copy/tripFiscalCopy";
import {
  FiscalCorrectionReasonField,
  isFiscalCorrectionReasonValid,
} from "./FiscalCorrectionReasonField";

const copy = tripFiscalCopy.fixSheet;
const MAX_NOMBRE_LENGTH = 300;

/** Prefijo de ids de control (focus post-validación en el sheet). */
export const FISCAL_CORRECTION_RFC_ID_PREFIX = "fiscal-correction";

export interface FiscalCorrectionRfcFieldsProps {
  stop: TripStop;
  rfc: string;
  nombre: string;
  reason: string;
  propagate: boolean;
  rfcTouched: boolean;
  reasonError: string | null;
  idPrefix?: string;
  disabled?: boolean;
  onRfcChange: (value: string) => void;
  onNombreChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onPropagateChange: (value: boolean) => void;
  onRfcBlur: () => void;
  onReasonBlur: () => void;
  onReasonErrorChange: (error: string | null) => void;
}

export function useFiscalCorrectionRfcValidation(
  rfc: string,
  reason: string,
  rfcTouched: boolean,
) {
  const normalizedRfc = rfc.trim().toUpperCase();
  const rfcValid = normalizedRfc.length > 0 && isValidSatRfc(normalizedRfc);
  const reasonValid = isFiscalCorrectionReasonValid(reason);

  return {
    normalizedRfc,
    rfcValid,
    reasonValid,
    showRfcError: rfcTouched && !rfcValid,
    canSubmit: rfcValid && reasonValid,
  };
}

export function FiscalCorrectionRfcFields({
  stop,
  rfc,
  nombre,
  reason,
  propagate,
  rfcTouched,
  reasonError,
  idPrefix = FISCAL_CORRECTION_RFC_ID_PREFIX,
  disabled = false,
  onRfcChange,
  onNombreChange,
  onReasonChange,
  onPropagateChange,
  onRfcBlur,
  onReasonBlur,
  onReasonErrorChange,
}: FiscalCorrectionRfcFieldsProps) {
  const { showRfcError } = useFiscalCorrectionRfcValidation(rfc, reason, rfcTouched);
  const { hasPermission } = usePermissions();
  const canPropagateToClient = hasPermission("clients", "update");

  const rfcId = `${idPrefix}-rfc`;
  const nombreId = `${idPrefix}-nombre`;
  const reasonId = `${idPrefix}-reason`;
  const propagateId = `${idPrefix}-propagate`;
  const rfcErrorMessage = showRfcError ? copy.rfcInvalid : undefined;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={rfcId}>{copy.rfcLabel}</Label>
        <Input
          id={rfcId}
          value={rfc}
          maxLength={13}
          disabled={disabled}
          error={showRfcError}
          className="font-mono uppercase"
          {...getFieldErrorAriaProps(rfcId, rfcErrorMessage)}
          onChange={(event) => onRfcChange(event.target.value.toUpperCase())}
          onBlur={onRfcBlur}
        />
        {showRfcError ? (
          <FieldInlineError fieldId={rfcId} message={copy.rfcInvalid} />
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={nombreId}>{copy.nombreLabel}</Label>
        <Input
          id={nombreId}
          value={nombre}
          maxLength={MAX_NOMBRE_LENGTH}
          disabled={disabled}
          onChange={(event) => onNombreChange(event.target.value)}
        />
      </div>

      <FiscalCorrectionReasonField
        id={reasonId}
        value={reason}
        disabled={disabled}
        error={reasonError}
        onChange={(value) => {
          onReasonChange(value);
          if (reasonError) onReasonErrorChange(null);
        }}
        onBlur={() => {
          onReasonBlur();
          if (reason.trim().length > 0 && !isFiscalCorrectionReasonValid(reason)) {
            onReasonErrorChange(copy.reasonTooShort);
          }
        }}
      />

      {canPropagateToClient && stop.clientAddressId ? (
        <div className="flex items-start gap-3 rounded-lg border p-3">
          <Checkbox
            id={propagateId}
            checked={propagate}
            disabled={disabled}
            onCheckedChange={(checked) => onPropagateChange(checked === true)}
          />
          <div className="space-y-1">
            <Label htmlFor={propagateId} className="font-normal">
              {copy.propagateLabel}
            </Label>
            <p className="text-xs text-muted-foreground">{copy.propagateHint}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
