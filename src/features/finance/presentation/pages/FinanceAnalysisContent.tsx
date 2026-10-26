import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  resolveAnalysisPeriod,
  type FinanceAnalysisView,
} from "@features/finance/application";
import { getTodayString } from "@shared/utils/dateUtils";
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

/** Children del hub Análisis: caption sticky always-on + vista activa (nav en HubPageShell). */
export function FinanceAnalysisContent({ view }: FinanceAnalysisContentProps) {
  const [searchParams] = useSearchParams();
  const today = getTodayString();
  const period = useMemo(
    () =>
      resolveAnalysisPeriod(
        {
          from: searchParams.get("from"),
          to: searchParams.get("to"),
        },
        today,
      ),
    [searchParams, today],
  );
  const stickyCaption = formatAnalysisStickyCaption(period, today);
  const stickyCopy = financeCopy.analysisPeriod;

  return (
    <div className="space-y-4">
      <p
        role="note"
        aria-label={stickyCopy.stickyAriaLabel}
        className="sticky top-0 z-10 -mx-1 border-b border-border/60 bg-background/95 px-1 py-2 text-xs text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        {stickyCaption}
      </p>
      {renderView(view)}
    </div>
  );
}
