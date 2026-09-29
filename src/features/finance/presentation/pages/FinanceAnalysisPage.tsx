import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import {
  buildFinanceAnalysisSearchParams,
  isFinanceAnalysisView,
  type FinanceAnalysisView,
} from "@features/finance/application";
import {
  REPORTS_WAYFINDING_COPY,
  useReportsReturnHref,
} from "@shared/utils/reportsWayfinding";
import { FinanceSectionHeader } from "../components";
import { financeCopy } from "../copy";
import { FinanceAnalysisContent } from "./FinanceAnalysisContent";

export function FinanceAnalysisPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const reportsBackHref = useReportsReturnHref();

  const fromUrl = searchParams.get("view");
  const view: FinanceAnalysisView = isFinanceAnalysisView(fromUrl)
    ? fromUrl
    : "margin";

  const handleViewChange = useCallback(
    (nextView: FinanceAnalysisView) => {
      setSearchParams(
        buildFinanceAnalysisSearchParams(nextView, {
          preserveFrom: searchParams,
        }),
        { replace: true },
      );
    },
    [searchParams, setSearchParams],
  );

  return (
    <div className="space-y-6">
      <FinanceSectionHeader
        icon={<BarChart3 className="h-5 w-5" />}
        title={financeCopy.page.sections.analysis.title}
        subtitle={financeCopy.page.sections.analysis.subtitle}
        backHref={reportsBackHref}
        backLabel={REPORTS_WAYFINDING_COPY.backToReports}
      />
      <FinanceAnalysisContent view={view} onViewChange={handleViewChange} />
    </div>
  );
}
