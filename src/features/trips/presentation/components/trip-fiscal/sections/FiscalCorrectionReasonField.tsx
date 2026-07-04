/* eslint-disable react-refresh/only-export-components */
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import { FieldInlineError } from "@shared/ui/form/FieldInlineError";
import { tripFiscalCopy } from "../../../copy/tripFiscalCopy";

const copy = tripFiscalCopy.fixSheet;
export const FISCAL_CORRECTION_MAX_REASON_LENGTH = 500;
export const FISCAL_CORRECTION_MIN_REASON_LENGTH = 5;

export interface FiscalCorrectionReasonFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

export function FiscalCorrectionReasonField({
  id,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  label = copy.reasonLabel,
  placeholder = copy.reasonPlaceholder,
}: FiscalCorrectionReasonFieldProps) {
  const trimmedLength = value.trim().length;
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span
          id={`${id}-counter`}
          className="text-xs text-muted-foreground tabular-nums"
        >
          {copy.counter(trimmedLength, FISCAL_CORRECTION_MAX_REASON_LENGTH)}
        </span>
      </div>
      <Textarea
        id={id}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        maxLength={FISCAL_CORRECTION_MAX_REASON_LENGTH}
        onChange={(event) => {
          onChange(event.target.value.slice(0, FISCAL_CORRECTION_MAX_REASON_LENGTH));
        }}
        onBlur={onBlur}
      />
      {error ? (
        <FieldInlineError fieldId={id} message={error} />
      ) : null}
    </div>
  );
}

export function isFiscalCorrectionReasonValid(reason: string): boolean {
  return reason.trim().length >= FISCAL_CORRECTION_MIN_REASON_LENGTH;
}
