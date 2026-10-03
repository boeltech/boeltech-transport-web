import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@shared/ui/button";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  getNextPeriod,
  getPreviousPeriod,
  isoWeekNumber,
  type SalaryPeriodKind,
} from "../utils/buildSuggestedSettlementPeriod";

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

const SHORT_MONTH_NAMES_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
] as const;

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

function formatLabel(
  salaryPeriod: SalaryPeriodKind,
  periodStart: string,
  periodEnd: string,
): string {
  const s = parseDate(periodStart);
  const e = parseDate(periodEnd);

  switch (salaryPeriod) {
    case "weekly": {
      const weekNum = isoWeekNumber(periodStart);
      const startLabel = `${String(s.day).padStart(2, "0")} ${SHORT_MONTH_NAMES_ES[s.month]}`;
      const endLabel = `${String(e.day).padStart(2, "0")} ${SHORT_MONTH_NAMES_ES[e.month]} ${e.year}`;
      return `${settlementsCopy.periodStepper.weekPrefix(weekNum)} · ${startLabel} – ${endLabel}`;
    }
    case "biweekly": {
      const startLabel = `${String(s.day).padStart(2, "0")} ${SHORT_MONTH_NAMES_ES[s.month]}`;
      const endLabel = `${String(e.day).padStart(2, "0")} ${SHORT_MONTH_NAMES_ES[e.month]} ${e.year}`;
      return `${startLabel} – ${endLabel}`;
    }
    case "monthly":
      return `${MONTH_NAMES_ES[s.month]} ${s.year}`;
  }
}

export interface PeriodStepperProps {
  salaryPeriod: SalaryPeriodKind;
  periodStart: string;
  periodEnd: string;
  onChange: (start: string, end: string) => void;
}

export function PeriodStepper({
  salaryPeriod,
  periodStart,
  periodEnd,
  onChange,
}: PeriodStepperProps) {
  const label = formatLabel(salaryPeriod, periodStart, periodEnd);

  const handlePrev = () => {
    const prev = getPreviousPeriod(salaryPeriod, periodStart);
    onChange(prev.periodStart, prev.periodEnd);
  };

  const handleNext = () => {
    const next = getNextPeriod(salaryPeriod, periodStart);
    onChange(next.periodStart, next.periodEnd);
  };

  return (
    <div
      className="flex items-center justify-between gap-1 rounded-md border bg-muted/30 px-1 h-9"
      role="group"
      aria-label={settlementsCopy.periodStepper.label}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={handlePrev}
        aria-label={settlementsCopy.periodStepper.prevAriaLabel}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium text-center select-none truncate">
        {label}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={handleNext}
        aria-label={settlementsCopy.periodStepper.nextAriaLabel}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
