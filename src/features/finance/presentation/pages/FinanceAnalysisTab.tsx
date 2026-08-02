import { cn } from "@shared/lib/utils/cn";
import type { FinanceAnalysisView } from "@features/finance/application";
import { financeCopy } from "../copy";
import { ExpenseAnalysisTab } from "./ExpenseAnalysisTab";
import { ProfitabilityTab } from "./ProfitabilityTab";

interface FinanceAnalysisTabProps {
  queriesEnabled: boolean;
  view: FinanceAnalysisView;
  onViewChange: (view: FinanceAnalysisView) => void;
}

const VIEWS: FinanceAnalysisView[] = ["margin", "expenses"];

export function FinanceAnalysisTab({
  queriesEnabled,
  view,
  onViewChange,
}: FinanceAnalysisTabProps) {
  const labels = financeCopy.page.analysisViews;

  return (
    <div className="space-y-6">
      <div
        className="inline-flex items-center rounded-lg border border-border bg-muted/80 p-1 text-muted-foreground"
        role="radiogroup"
        aria-label={labels.ariaLabel}
      >
        {VIEWS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={view === option}
            onClick={() => onViewChange(option)}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              view === option
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            {option === "margin" ? labels.margin : labels.expenses}
          </button>
        ))}
      </div>

      {view === "margin" ? (
        <ProfitabilityTab queriesEnabled={queriesEnabled} />
      ) : (
        <ExpenseAnalysisTab queriesEnabled={queriesEnabled} />
      )}
    </div>
  );
}
