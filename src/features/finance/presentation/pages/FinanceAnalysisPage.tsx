import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  buildFinanceAnalysisHref,
  FINANCE_ANALYSIS_VIEWS,
  FINANCE_HUB_PATH,
  resolveFinanceAnalysisView,
} from "@features/finance/application";
import { HubPageShell } from "@shared/ui/page-shells";
import { ReportsReturnLink } from "@shared/ui/reports-return/ReportsReturnLink";
import { useReportsReturnHref } from "@shared/utils/reportsWayfinding";
import { financeCopy } from "../copy";
import { FinanceAnalysisContent } from "./FinanceAnalysisContent";

export function FinanceAnalysisPage() {
  const [searchParams] = useSearchParams();
  const view = resolveFinanceAnalysisView(searchParams.get("view"));
  const labels = financeCopy.page.analysisViews;
  const section = financeCopy.page.sections.analysis;
  const reportsReturnHref = useReportsReturnHref();
  const reportsNavState = useMemo(
    () => (reportsReturnHref ? { from: reportsReturnHref } : undefined),
    [reportsReturnHref],
  );

  const nav = useMemo(
    () =>
      FINANCE_ANALYSIS_VIEWS.map((id) => ({
        id,
        label: labels[id],
        href: buildFinanceAnalysisHref(id, { preserveFrom: searchParams }),
        state: reportsNavState,
      })),
    [labels, searchParams, reportsNavState],
  );

  return (
    <HubPageShell
      title={section.title}
      description={section.subtitle}
      nav={nav}
      activeNavId={view}
      navAriaLabel={labels.ariaLabel}
      relatedConfig={{
        label: financeCopy.page.hub.title,
        href: FINANCE_HUB_PATH,
        description: financeCopy.page.hub.description,
        state: reportsNavState,
      }}
    >
      <ReportsReturnLink />
      <FinanceAnalysisContent view={view} />
    </HubPageShell>
  );
}
