import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { getTodayString } from "@shared/utils/dateUtils";

import {
  DATE_FIELD_COPY,
  daysInMonth,
  formatIsoDate,
  formatMonthHeading,
  isIsoDateInRange,
  mondayFirstWeekday,
  parseIsoDateParts,
} from "./dateFieldUtils";

export type CalendarMonthProps = {
  /** Mes visible (cualquier día ISO del mes). */
  visibleMonth: string;
  onVisibleMonthChange: (isoDate: string) => void;
  selected?: string;
  onSelect: (isoDate: string) => void;
  min?: string;
  max?: string;
};

const YEAR_GRID_SIZE = 12;

function yearIsReachable(year: number, min?: string, max?: string): boolean {
  const start = formatIsoDate(year, 1, 1);
  const end = formatIsoDate(year, 12, 31);
  if (min && end < min) return false;
  if (max && start > max) return false;
  return true;
}

export function CalendarMonth({
  visibleMonth,
  onVisibleMonthChange,
  selected,
  onSelect,
  min,
  max,
}: CalendarMonthProps) {
  const [view, setView] = useState<"month" | "year">("month");
  const parts =
    parseIsoDateParts(visibleMonth) ?? parseIsoDateParts(getTodayString());
  if (!parts) return null;

  const { year, month } = parts;
  const today = getTodayString();
  const leading = mondayFirstWeekday(year, month, 1);
  const count = daysInMonth(year, month);

  const goTo = (nextYear: number, nextMonth: number) => {
    onVisibleMonthChange(formatIsoDate(nextYear, nextMonth, 1));
  };

  const goMonth = (delta: number) => {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    goTo(next.getUTCFullYear(), next.getUTCMonth() + 1);
  };

  const goYear = (delta: number) => {
    goTo(year + delta, month);
  };

  const yearGridStart = year - (year % YEAR_GRID_SIZE);
  const yearGrid = Array.from(
    { length: YEAR_GRID_SIZE },
    (_, index) => yearGridStart + index,
  );

  if (view === "year") {
    return (
      <div className="w-[252px] space-y-3">
        <div className="flex items-center justify-between gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={DATE_FIELD_COPY.previousYearRange}
            onClick={() => goYear(-YEAR_GRID_SIZE)}
          >
            <ChevronsLeft />
          </Button>
          <p className="text-sm font-medium tabular-nums">
            {yearGrid[0]} – {yearGrid[YEAR_GRID_SIZE - 1]}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={DATE_FIELD_COPY.nextYearRange}
            onClick={() => goYear(YEAR_GRID_SIZE)}
          >
            <ChevronsRight />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {yearGrid.map((gridYear) => {
            const isSelected = gridYear === year;
            const enabled = yearIsReachable(gridYear, min, max);
            return (
              <button
                key={gridYear}
                type="button"
                disabled={!enabled}
                onClick={() => {
                  goTo(gridYear, month);
                  setView("month");
                }}
                className={cn(
                  "h-9 rounded-md text-sm tabular-nums",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected && "bg-primary text-primary-foreground",
                  !isSelected && enabled && "hover:bg-accent",
                  !enabled &&
                    "cursor-not-allowed text-muted-foreground opacity-40",
                )}
              >
                {gridYear}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const cells: Array<{ iso: string } | null> = [];
  for (let i = 0; i < leading; i += 1) cells.push(null);
  for (let day = 1; day <= count; day += 1) {
    cells.push({ iso: formatIsoDate(year, month, day) });
  }

  return (
    <div className="w-[252px] space-y-3">
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={DATE_FIELD_COPY.previousYear}
          onClick={() => goYear(-1)}
        >
          <ChevronsLeft />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={DATE_FIELD_COPY.previousMonth}
          onClick={() => goMonth(-1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-8 min-w-0 flex-1 px-1 text-sm font-medium capitalize"
          aria-label={DATE_FIELD_COPY.chooseYear}
          onClick={() => setView("year")}
        >
          {formatMonthHeading(year, month)}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={DATE_FIELD_COPY.nextMonth}
          onClick={() => goMonth(1)}
        >
          <ChevronRight />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={DATE_FIELD_COPY.nextYear}
          onClick={() => goYear(1)}
        >
          <ChevronsRight />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DATE_FIELD_COPY.weekdays.map((label) => (
          <span
            key={label}
            className="text-[11px] font-medium text-muted-foreground"
          >
            {label}
          </span>
        ))}
        {cells.map((cell, index) => {
          if (!cell) {
            return <span key={`empty-${index}`} />;
          }
          const isSelected = cell.iso === selected;
          const isToday = cell.iso === today;
          const enabled = isIsoDateInRange(cell.iso, min, max);

          return (
            <button
              key={cell.iso}
              type="button"
              disabled={!enabled}
              onClick={() => onSelect(cell.iso)}
              className={cn(
                "h-8 w-8 rounded-md text-sm tabular-nums",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && enabled && "hover:bg-accent",
                !isSelected && isToday && "font-semibold text-primary",
                !enabled &&
                  "cursor-not-allowed text-muted-foreground opacity-40",
              )}
            >
              {Number(cell.iso.slice(8, 10))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
