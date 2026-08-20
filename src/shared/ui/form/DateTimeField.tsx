import { useState, type ReactNode } from "react";

import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";

import { DateField } from "./DateField";
import {
  DATE_FIELD_COPY,
  joinDateTimeLocal,
  splitDateTimeLocal,
} from "./dateFieldUtils";

export type DateTimePreset = {
  label: string;
  value: string;
};

export type DateTimeFieldProps = {
  id: string;
  name?: string;
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  error?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  /** Si hay día y la hora está vacía, completa con este HH:mm. */
  defaultTimeOnDateSelect?: string;
  /** Chips bajo el control (p. ej. Hoy 08:00). */
  presets?: DateTimePreset[];
  /** CTA a la derecha (p. ej. Ahora en tracking). */
  endAdornment?: ReactNode;
  showMexicoCaption?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export function DateTimeField({
  id,
  name,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  min,
  max,
  className,
  defaultTimeOnDateSelect,
  presets,
  endAdornment,
  showMexicoCaption = true,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DateTimeFieldProps) {
  const parsed = splitDateTimeLocal(value);
  const [pendingDate, setPendingDate] = useState("");
  const date = parsed.date || pendingDate;
  const time = parsed.time;
  const invalid = ariaInvalid ?? error;

  const emit = (nextDate: string, nextTime: string) => {
    if (nextDate && nextTime) {
      setPendingDate("");
      onChange(joinDateTimeLocal(nextDate, nextTime));
      return;
    }
    if (!nextDate) {
      setPendingDate("");
      onChange("");
    }
  };

  const handleDateChange = (nextDate: string) => {
    const nextTime = time || defaultTimeOnDateSelect || "";
    if (nextDate && nextTime) {
      emit(nextDate, nextTime);
      return;
    }
    setPendingDate(nextDate);
    if (!nextTime) {
      onChange("");
    }
  };

  const handleTimeChange = (nextTime: string) => {
    if (date && nextTime) {
      emit(date, nextTime);
      return;
    }
    if (!nextTime) {
      onChange("");
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <DateField
          id={id}
          name={name}
          value={date}
          onChange={handleDateChange}
          onBlur={onBlur}
          error={error}
          disabled={disabled}
          min={min}
          max={max}
          className="min-w-0 flex-1"
          aria-invalid={invalid}
          aria-describedby={ariaDescribedBy}
        />
        <Input
          id={`${id}-time`}
          type="time"
          step={60}
          value={time}
          disabled={disabled}
          error={error}
          aria-label={DATE_FIELD_COPY.timeAriaLabel}
          aria-invalid={invalid}
          aria-describedby={ariaDescribedBy}
          onChange={(event) => handleTimeChange(event.target.value)}
          onBlur={onBlur}
          className="w-full sm:w-[140px]"
        />
        {endAdornment ? (
          <div className="flex shrink-0 sm:pt-0.5">{endAdornment}</div>
        ) : null}
      </div>

      {presets && presets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.value}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => {
                setPendingDate("");
                onChange(preset.value);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      ) : null}

      {showMexicoCaption ? (
        <p className="text-xs text-muted-foreground">
          {DATE_FIELD_COPY.mexicoTimeCaption}
        </p>
      ) : null}
    </div>
  );
}
