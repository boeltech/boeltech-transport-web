import { useMemo, useState } from "react";
import { Calendar, ChevronsLeft, ChevronsRight, X } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { getTodayString } from "@shared/utils/dateUtils";

import {
  DATE_FIELD_COPY,
  formatIsoMonth,
  formatMonthHeading,
  formatMonthShortName,
  formatMonthTriggerLabel,
  isIsoMonthInRange,
  parseIsoMonthParts,
} from "./dateFieldUtils";

export type MonthFieldProps = {
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
  clearable?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

function currentMonthKey(): string {
  return getTodayString().slice(0, 7);
}

export function MonthField({
  id,
  name,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  placeholder = DATE_FIELD_COPY.placeholderMonth,
  min,
  max,
  clearable = false,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: MonthFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoMonthParts(value) ? value : "";
  const selectedParts = selected ? parseIsoMonthParts(selected) : null;
  const seedYear =
    selectedParts?.year ??
    parseIsoMonthParts(min ?? "")?.year ??
    parseIsoMonthParts(currentMonthKey())?.year ??
    new Date().getUTCFullYear();
  const [visibleYear, setVisibleYear] = useState(seedYear);

  const display = useMemo(() => {
    if (!selectedParts) return placeholder;
    return formatMonthTriggerLabel(selectedParts.year, selectedParts.month);
  }, [placeholder, selectedParts]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setVisibleYear(
        selectedParts?.year ??
          parseIsoMonthParts(min ?? "")?.year ??
          parseIsoMonthParts(currentMonthKey())?.year ??
          seedYear,
      );
    } else {
      onBlur?.();
    }
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
    onBlur?.();
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
            selected && clearable && "pr-2",
            error &&
              "border-destructive focus-visible:ring-1 focus-visible:ring-destructive focus-visible:ring-offset-1",
            className,
          )}
        >
          <Calendar className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{display}</span>
          {clearable && selected ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={DATE_FIELD_COPY.clearMonth}
              className="ml-auto rounded p-1 hover:bg-muted"
              onClick={(event) => {
                event.stopPropagation();
                handleClear();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.stopPropagation();
                  handleClear();
                }
              }}
            >
              <X className="h-3 w-3" />
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[60] w-auto p-3"
        data-date-field-calendar=""
      >
        <div className="w-[252px] space-y-3">
          <div className="flex items-center justify-between gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={DATE_FIELD_COPY.previousYear}
              onClick={() => setVisibleYear((year) => year - 1)}
            >
              <ChevronsLeft />
            </Button>
            <p className="text-sm font-medium tabular-nums">{visibleYear}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={DATE_FIELD_COPY.nextYear}
              onClick={() => setVisibleYear((year) => year + 1)}
            >
              <ChevronsRight />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
              const monthKey = formatIsoMonth(visibleYear, month);
              const isSelected = monthKey === selected;
              const enabled = isIsoMonthInRange(monthKey, min, max);
              return (
                <button
                  key={monthKey}
                  type="button"
                  disabled={!enabled}
                  aria-label={formatMonthHeading(visibleYear, month)}
                  onClick={() => {
                    onChange(monthKey);
                    setOpen(false);
                    onBlur?.();
                  }}
                  className={cn(
                    "h-9 rounded-md text-sm capitalize tabular-nums",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && enabled && "hover:bg-accent",
                    !enabled &&
                      "cursor-not-allowed text-muted-foreground opacity-40",
                  )}
                >
                  {formatMonthShortName(month)}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
