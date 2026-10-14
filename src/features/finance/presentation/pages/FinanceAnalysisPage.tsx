import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  buildFinanceAnalysisHref,
  FINANCE_ANALYSIS_VIEWS,
  resolveFinanceAnalysisView,
} from "@features/finance/application";
import { HubPageShell } from "@shared/ui/page-shells";
import { ReportsReturnLink } from "@shared/ui/reports-return/ReportsReturnLink";
import { financeCopy } from "../copy";
import { FinanceAnalysisContent } from "./FinanceAnalysisContent";

export function FinanceAnalysisPage() {
  const [searchParams] = useSearchParams();
  const view = resolveFinanceAnalysisView(searchParams.get("view"));
  const labels = financeCopy.page.analysisViews;
  const section = financeCopy.page.sections.analysis;

  const nav = useMemo(
    () =>
      FINANCE_ANALYSIS_VIEWS.map((id) => ({
        id,
        label: labels[id],
        href: buildFinanceAnalysisHref(id, { preserveFrom: searchParams }),
      })),
    [labels, searchParams],
  );

  return (
    <div className="space-y-4">
      <ReportsReturnLink />
      <HubPageShell
        title={section.title}
        description={section.subtitle}
        nav={nav}
        activeNavId={view}
        navAriaLabel={labels.ariaLabel}
      >
        <FinanceAnalysisContent view={view} />
      </HubPageShell>
    </div>
  );
}
