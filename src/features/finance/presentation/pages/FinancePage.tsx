import { type ReactNode, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Landmark } from "lucide-react";
import { useAuth } from "@features/auth";
import { buildFinanceTabSearchParams } from "@features/finance/application";
import { canAccessFinanceSummaryRoute } from "@shared/permissions";
import { DetailPageShell } from "@shared/ui/page-shells";
import { ExpenseAnalysisTab } from "./ExpenseAnalysisTab";
import { FinanceInvoicesTab } from "./FinanceInvoicesTab";
import { FinanceSummaryTab } from "./FinanceSummaryTab";
import { ProfitabilityTab } from "./ProfitabilityTab";
import { ReportsTab } from "./ReportsTab";
import { financeCopy } from "../copy";

const FULL_TABS = [
  "summary",
  "invoices",
  "profitability",
  "expenses",
  "reports",
] as const;

type FinanceTab = (typeof FULL_TABS)[number];

export function FinancePage() {
  const { user } = useAuth();
  const canAnalytics = useMemo(
    () => canAccessFinanceSummaryRoute(user?.role),
    [user?.role],
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const enabledTabs = useMemo<FinanceTab[]>(
    () => (canAnalytics ? [...FULL_TABS] : ["invoices"]),
    [canAnalytics],
  );

  useEffect(() => {
    const requested = searchParams.get("tab");
    if (
      !requested ||
      enabledTabs.includes(requested as FinanceTab)
    ) {
      return;
    }
    setSearchParams(buildFinanceTabSearchParams("invoices"), { replace: true });
  }, [enabledTabs, searchParams, setSearchParams]);

  const activeTab = useMemo<FinanceTab>(() => {
    const requested = searchParams.get("tab");
    if (requested && enabledTabs.includes(requested as FinanceTab)) {
      return requested as FinanceTab;
    }
    return canAnalytics ? "summary" : "invoices";
  }, [searchParams, enabledTabs, canAnalytics]);

  const handleTabChange = (value: string) => {
    setSearchParams(buildFinanceTabSearchParams(value));
  };

  const tabs = useMemo(() => {
    const items = [
      canAnalytics
        ? {
            value: "summary",
            label: financeCopy.page.tabs.summary,
            content: <FinanceSummaryTab queriesEnabled={activeTab === "summary"} />,
          }
        : null,
      {
        value: "invoices",
        label: financeCopy.page.tabs.invoices,
        content: <FinanceInvoicesTab showFinanceSummaryMetrics={canAnalytics} />,
      },
      canAnalytics
        ? {
            value: "profitability",
            label: financeCopy.page.tabs.profitability,
            content: <ProfitabilityTab queriesEnabled={activeTab === "profitability"} />,
          }
        : null,
      canAnalytics
        ? {
            value: "expenses",
            label: financeCopy.page.tabs.expenses,
            content: <ExpenseAnalysisTab queriesEnabled={activeTab === "expenses"} />,
          }
        : null,
      canAnalytics
        ? {
            value: "reports",
            label: financeCopy.page.tabs.reports,
            content: <ReportsTab queriesEnabled={activeTab === "reports"} />,
          }
        : null,
    ].filter(Boolean);

    return items as Array<{ value: string; label: string; content: ReactNode }>;
  }, [activeTab, canAnalytics]);

  return (
    <DetailPageShell
      isLoading={false}
      header={{
        backHref: financeCopy.page.backHref,
        backLabel: financeCopy.page.backLabel,
        icon: <Landmark className="h-5 w-5" />,
        iconVariant: "primary",
        title: financeCopy.page.title,
        subtitle: financeCopy.page.subtitle,
      }}
      tabs={{
        defaultValue: canAnalytics ? "summary" : "invoices",
        value: activeTab,
        onValueChange: handleTabChange,
        items: tabs,
      }}
    />
  );
}
