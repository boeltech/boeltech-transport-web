import { useState } from "react";
import {
  ANALYSIS_PERIOD_PRESETS,
  analysisPeriodUrlRange,
  type AnalysisPeriodChoice,
  type FinanceDateRange,
  type ResolvedAnalysisPeriod,
} from "@features/finance/application";
import { ListingDateRangeFilter } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { financeCopy } from "../copy";

const copy = financeCopy.analysisPeriod;

interface AnalysisPeriodSelectorProps {
  period: ResolvedAnalysisPeriod;
  /** `from`/`to` a escribir en la URL (vacíos = periodo por defecto). */
  onRangeChange: (range: FinanceDateRange) => void;
  today: string;
  idPrefix: string;
}

/** Opciones rápidas de periodo + rango personalizado (franja fija del hub Análisis). */
export function AnalysisPeriodSelector({
  period,
  onRangeChange,
  today,
  idPrefix,
}: AnalysisPeriodSelectorProps) {
  const [customRequested, setCustomRequested] = useState(false);
  const showCustom = period.choice === "custom" || customRequested;
  const selectValue: AnalysisPeriodChoice = showCustom ? "custom" : period.choice;

  const handleChoice = (value: string) => {
    const choice = value as AnalysisPeriodChoice;
    if (choice === "custom") {
      setCustomRequested(true);
      return;
    }
    setCustomRequested(false);
    onRangeChange(analysisPeriodUrlRange(choice, today));
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">{copy.label}</p>
        <Select value={selectValue} onValueChange={handleChoice}>
          <SelectTrigger className="w-[190px]" aria-label={copy.label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[...ANALYSIS_PERIOD_PRESETS, "custom" as const].map((choice) => (
              <SelectItem key={choice} value={choice}>
                {copy.options[choice]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showCustom ? (
        <ListingDateRangeFilter
          fromDate={period.from ?? ""}
          toDate={period.to ?? ""}
          onApply={(from, to) => {
            setCustomRequested(false);
            onRangeChange({ from, to });
          }}
          onClear={() => {
            setCustomRequested(false);
            onRangeChange({ from: "", to: "" });
          }}
          heading={copy.customHeading}
          placeholder={copy.customPlaceholder}
          idPrefix={`${idPrefix}-custom`}
        />
      ) : null}
    </div>
  );
}
