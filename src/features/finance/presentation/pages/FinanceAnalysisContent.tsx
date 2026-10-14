import type { FinanceAnalysisView } from "@features/finance/application";
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

/** Children del hub Análisis: solo la vista activa (nav vive en HubPageShell). */
export function FinanceAnalysisContent({ view }: FinanceAnalysisContentProps) {
  return renderView(view);
}
