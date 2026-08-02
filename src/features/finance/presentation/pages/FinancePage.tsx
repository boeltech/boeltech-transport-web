import { type ReactNode, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Landmark } from "lucide-react";
import { ApprovalInboxPage } from "@features/approvals";
import { useAuth } from "@features/auth";
import {
  buildFinanceTabSearchParams,
  isFinanceAnalysisView,
  resolveFinanceLegacyTab,
  type FinanceAnalysisView,
  type FinanceHubTab,
} from "@features/finance/application";
import { canAccessFinanceSummaryRoute, usePermissions } from "@shared/permissions";
import { DetailPageShell } from "@shared/ui/page-shells";
import { FinanceCobranzaTab } from "./FinanceCobranzaTab";
import { FinanceAnalysisTab } from "./FinanceAnalysisTab";
import { FinanceInvoiceableTripsTab } from "./FinanceInvoiceableTripsTab";
import { FinanceInvoicesTab } from "./FinanceInvoicesTab";
import { FinanceSummaryTab } from "./FinanceSummaryTab";
import { financeCopy } from "../copy";
import { canShowInvoiceFromTripCta } from "../utils/financeInvoiceFromTripCta";

const ANALYTICS_TABS: FinanceHubTab[] = [
  "summary",
  "invoiceable",
  "invoices",
  "cobros",
  "analysis",
  "approvals",
];

const LIMITED_TABS: FinanceHubTab[] = ["invoices", "cobros"];

const APPROVALS_TAB_VALUE = "approvals";

export function FinancePage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canAnalytics = useMemo(
    () => canAccessFinanceSummaryRoute(user?.role),
    [user?.role],
  );
  const canInvoiceFromTrip = canShowInvoiceFromTripCta(hasPermission);
  const canApprove = hasPermission("finance_approvals", "read");

  const [searchParams, setSearchParams] = useSearchParams();
  const enabledTabs = useMemo<FinanceHubTab[]>(() => {
    const base = canAnalytics ? ANALYTICS_TABS : LIMITED_TABS;
    return base.filter(
      (tab) =>
        (tab !== "invoiceable" || canInvoiceFromTrip) &&
        (tab !== APPROVALS_TAB_VALUE || canApprove),
    );
  }, [canAnalytics, canApprove, canInvoiceFromTrip]);

  useEffect(() => {
    const requested = searchParams.get("tab");
    const resolved = resolveFinanceLegacyTab(requested);

    if (resolved.redirected && resolved.tab && enabledTabs.includes(resolved.tab)) {
      setSearchParams(
        buildFinanceTabSearchParams(resolved.tab, {
          view: resolved.view,
          preserveFrom: searchParams,
        }),
        { replace: true },
      );
      return;
    }

    if (requested && !enabledTabs.includes(requested as FinanceHubTab)) {
      setSearchParams(
        buildFinanceTabSearchParams("invoices", {
          preserveFrom: searchParams,
        }),
        { replace: true },
      );
    }
  }, [enabledTabs, searchParams, setSearchParams]);

  const activeTab = useMemo<FinanceHubTab>(() => {
    const resolved = resolveFinanceLegacyTab(searchParams.get("tab"));
    if (resolved.tab && enabledTabs.includes(resolved.tab)) {
      return resolved.tab;
    }
    return canAnalytics ? "summary" : "invoices";
  }, [searchParams, enabledTabs, canAnalytics]);

  const analysisView = useMemo<FinanceAnalysisView>(() => {
    const fromUrl = searchParams.get("view");
    if (isFinanceAnalysisView(fromUrl)) return fromUrl;
    const legacy = resolveFinanceLegacyTab(searchParams.get("tab"));
    return legacy.view ?? "margin";
  }, [searchParams]);

  const handleTabChange = useCallback(
    (value: string) => {
      setSearchParams(
        buildFinanceTabSearchParams(value, {
          view: value === "analysis" ? analysisView : undefined,
          preserveFrom: searchParams,
        }),
        { replace: true },
      );
    },
    [analysisView, searchParams, setSearchParams],
  );

  const handleAnalysisViewChange = useCallback(
    (view: FinanceAnalysisView) => {
      setSearchParams(
        buildFinanceTabSearchParams("analysis", {
          view,
          preserveFrom: searchParams,
        }),
        { replace: true },
      );
    },
    [searchParams, setSearchParams],
  );

  const tabs = useMemo(() => {
    const items = [
      canAnalytics
        ? {
            value: "summary",
            label: financeCopy.page.tabs.summary,
            content: (
              <FinanceSummaryTab queriesEnabled={activeTab === "summary"} />
            ),
          }
        : null,
      canInvoiceFromTrip
        ? {
            value: "invoiceable",
            label: financeCopy.page.tabs.invoiceable,
            content: (
              <FinanceInvoiceableTripsTab
                queriesEnabled={activeTab === "invoiceable"}
              />
            ),
          }
        : null,
      {
        value: "invoices",
        label: financeCopy.page.tabs.invoices,
        content: (
          <FinanceInvoicesTab showFinanceSummaryMetrics={canAnalytics} />
        ),
      },
      {
        value: "cobros",
        label: financeCopy.page.tabs.cobros,
        content: <FinanceCobranzaTab />,
      },
      canAnalytics
        ? {
            value: "analysis",
            label: financeCopy.page.tabs.analysis,
            content: (
              <FinanceAnalysisTab
                queriesEnabled={activeTab === "analysis"}
                view={analysisView}
                onViewChange={handleAnalysisViewChange}
              />
            ),
          }
        : null,
      canApprove
        ? {
            value: APPROVALS_TAB_VALUE,
            label: financeCopy.page.tabs.approvals,
            content: <ApprovalInboxPage embedded />,
          }
        : null,
    ].filter(Boolean);

    return items as Array<{ value: string; label: string; content: ReactNode }>;
  }, [
    activeTab,
    analysisView,
    canAnalytics,
    canApprove,
    canInvoiceFromTrip,
    handleAnalysisViewChange,
  ]);

  return (
    <DetailPageShell
      isLoading={false}
      header={{
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
