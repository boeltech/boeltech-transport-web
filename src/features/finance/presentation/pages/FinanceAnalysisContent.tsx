import {
  useAnalysisPeriod,
  type FinanceAnalysisView,
} from "@features/finance/application";
import { AnalysisPeriodSelector } from "../components/AnalysisPeriodSelector";
import { OperatingResultSection } from "../components/OperatingResultCascade";
import { financeCopy } from "../copy";
import { formatAnalysisStickyCaption } from "../utils/analysisPeriodFormat";
import { ExpenseAnalysisTab } from "./ExpenseAnalysisTab";
import { PerformanceTab } from "./PerformanceTab";
import { ProfitabilityTab } from "./ProfitabilityTab";

interface FinanceAnalysisContentProps {
  view: FinanceAnalysisView;
}

function renderView(view: FinanceAnalysisView) {
  switch (view) {
    case "expenses":
      return <ExpenseAnalysisTab />;
    case "margin":
      return <ProfitabilityTab />;
    default:
      return <PerformanceTab />;
  }
}

/**
 * Children del hub Análisis: franja fija con el selector de periodo único y su
 * caption (D2/D3) + Resultado operativo (ATF, todas las vistas) + vista activa.
 */
export function FinanceAnalysisContent({ view }: FinanceAnalysisContentProps) {
  const { period, today, setRange } = useAnalysisPeriod();
  const stickyCaption = formatAnalysisStickyCaption(period, today);
  const stickyCopy = financeCopy.analysisPeriod;

  return (
    <div className="space-y-4">
      <div
        data-testid="analysis-period-strip"
        className="sticky top-0 z-10 -mx-1 flex flex-col gap-2 border-b border-border/60 bg-background/95 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-4"
      >
        <AnalysisPeriodSelector
          period={period}
          onRangeChange={setRange}
          today={today}
          idPrefix="analysis-period"
        />
        <p
          role="note"
          aria-label={stickyCopy.stickyAriaLabel}
          className="text-xs text-muted-foreground sm:pb-2.5"
        >
          {stickyCaption}
        </p>
      </div>
      <OperatingResultSection period={period} today={today} onRangeChange={setRange} />
      {renderView(view)}
    </div>
  );
}
