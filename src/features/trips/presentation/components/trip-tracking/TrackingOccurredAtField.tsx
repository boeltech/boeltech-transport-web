import { Button } from "@shared/ui/button";
import {
  DateTimeField,
  FieldInlineError,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { Label } from "@shared/ui/label";
import { utcIsoToLocalInput } from "@shared/utils/dateUtils";

import { trackingCopy } from "../../copy";

type TrackingOccurredAtFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string | null;
};

export function TrackingOccurredAtField({
  id,
  label,
  value,
  onChange,
  disabled,
  error,
  errorMessage,
}: TrackingOccurredAtFieldProps) {
  const message = errorMessage ?? undefined;
  const invalid = error || Boolean(message);
  const aria = getFieldErrorAriaProps(id, message);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <DateTimeField
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        error={invalid}
        aria-invalid={aria["aria-invalid"]}
        aria-describedby={aria["aria-describedby"]}
        endAdornment={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onChange(utcIsoToLocalInput(new Date().toISOString()))}
          >
            {trackingCopy.action.now}
          </Button>
        }
      />
      <FieldInlineError fieldId={id} message={message} />
    </div>
  );
}
