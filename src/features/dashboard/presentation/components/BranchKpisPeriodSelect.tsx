import { Button } from "@shared/ui/button";
import {
  BRANCH_KPIS_PERIOD_VALUES,
  type BranchKpisPeriodValue,
} from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";

const copy = dashboardCopy.branchKpis.periodOptions;

interface BranchKpisPeriodSelectProps {
  value: BranchKpisPeriodValue;
  onChange: (period: BranchKpisPeriodValue) => void;
  "aria-label"?: string;
}

export function BranchKpisPeriodSelect({
  value,
  onChange,
  "aria-label": ariaLabel = copy.ariaLabel,
}: BranchKpisPeriodSelectProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex gap-0.5 rounded-md border bg-muted/40 p-0.5"
    >
      {BRANCH_KPIS_PERIOD_VALUES.map((period) => (
        <Button
          key={period}
          type="button"
          variant={value === period ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => onChange(period)}
        >
          {copy[period]}
        </Button>
      ))}
    </div>
  );
}
