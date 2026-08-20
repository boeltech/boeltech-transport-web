import { useMemo, useState } from "react";
import { Calendar } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { formatDate, getTodayString } from "@shared/utils/dateUtils";

import { CalendarMonth } from "./CalendarMonth";
import { DATE_FIELD_COPY, parseIsoDateParts } from "./dateFieldUtils";

export type DateFieldProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export function DateField({
  id,
  name,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  placeholder = DATE_FIELD_COPY.placeholderDate,
  min,
  max,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDateParts(value) ? value : "";
  const visibleSeed = selected || min || getTodayString();
  const [visibleMonth, setVisibleMonth] = useState(visibleSeed);

  const display = useMemo(
    () => (selected ? formatDate(selected) : placeholder),
    [placeholder, selected],
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setVisibleMonth(selected || min || getTodayString());
    } else {
      onBlur?.();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          name={name}
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid ?? error}
          aria-describedby={ariaDescribedBy}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "h-10 w-full justify-start font-normal",
            !selected && "text-muted-foreground",
            error &&
              "border-destructive focus-visible:ring-1 focus-visible:ring-destructive focus-visible:ring-offset-1",
            className,
          )}
        >
          <Calendar className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{display}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[60] w-auto p-3"
        data-date-field-calendar=""
      >
        <CalendarMonth
          visibleMonth={visibleMonth}
          onVisibleMonthChange={setVisibleMonth}
          selected={selected || undefined}
          min={min}
          max={max}
          onSelect={(isoDate) => {
            onChange(isoDate);
            setOpen(false);
            onBlur?.();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
