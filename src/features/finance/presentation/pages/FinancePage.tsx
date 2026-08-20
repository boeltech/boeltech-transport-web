import { type ReactNode, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Landmark } from "lucide-react";
import { ApprovalInboxPage } from "@features/approvals";
import { useAuth } from "@features/auth";
import { isClientPortalRole } from "@shared/constants/roles";
import {
  buildFinanceTabSearchParams,
  isFinanceAnalysisView,
  isFinanceAnalyticsEnabled,
  isFinanceCobrosTabEnabled,
  resolveFinanceLegacyTab,
  type FinanceAnalysisView,
  type FinanceHubTab,
} from "@features/finance/application";
import { usePermissions } from "@shared/permissions";
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

/** Staff sin analytics (p. ej. dispatcher): solo facturas. */
const LIMITED_TABS: FinanceHubTab[] = ["invoices"];

/** Portal client: solo consulta de facturas (D4). */
const CLIENT_PORTAL_TABS: FinanceHubTab[] = ["invoices"];

const APPROVALS_TAB_VALUE = "approvals";

export function FinancePage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isClientPortal = isClientPortalRole(user?.role);
  const canAnalytics = isFinanceAnalyticsEnabled({
    isClientPortal,
    hasFinanceRead: hasPermission("finance", "read"),
  });
  const canInvoiceFromTrip = canShowInvoiceFromTripCta(hasPermission);
  const canApprove = hasPermission("finance_approvals", "read");
  const canFinanceCobros = isFinanceCobrosTabEnabled({
    isClientPortal,
    hasFinanceCreate: hasPermission("finance", "create"),
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const enabledTabs = useMemo<FinanceHubTab[]>(() => {
    const base = isClientPortal
      ? CLIENT_PORTAL_TABS
      : canAnalytics
        ? ANALYTICS_TABS
        : LIMITED_TABS;
    return base.filter(
      (tab) =>
        (tab !== "invoiceable" || canInvoiceFromTrip) &&
        (tab !== APPROVALS_TAB_VALUE || canApprove) &&
        (tab !== "cobros" || canFinanceCobros),
    );
  }, [canAnalytics, canApprove, canFinanceCobros, canInvoiceFromTrip, isClientPortal]);

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
    if (isClientPortal) return "invoices";
    return canAnalytics ? "summary" : "invoices";
  }, [searchParams, enabledTabs, canAnalytics, isClientPortal]);

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
      !isClientPortal && canAnalytics
        ? {
            value: "summary",
            label: financeCopy.page.tabs.summary,
            content: (
              <FinanceSummaryTab queriesEnabled={activeTab === "summary"} />
            ),
          }
        : null,
      !isClientPortal && canInvoiceFromTrip
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
        label: isClientPortal
          ? financeCopy.page.portal.invoicesTab
          : financeCopy.page.tabs.invoices,
        content: (
          <FinanceInvoicesTab
            showFinanceSummaryMetrics={canAnalytics && !isClientPortal}
            isClientPortal={isClientPortal}
          />
        ),
      },
      canFinanceCobros
        ? {
            value: "cobros",
            label: financeCopy.page.tabs.cobros,
            content: <FinanceCobranzaTab />,
          }
        : null,
      !isClientPortal && canAnalytics
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
      !isClientPortal && canApprove
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
    canFinanceCobros,
    canInvoiceFromTrip,
    handleAnalysisViewChange,
    isClientPortal,
  ]);

  return (
    <DetailPageShell
      isLoading={false}
      header={{
        icon: <Landmark className="h-5 w-5" />,
        iconVariant: "primary",
        title: isClientPortal
          ? financeCopy.page.portal.title
          : financeCopy.page.title,
        subtitle: isClientPortal
          ? financeCopy.page.portal.subtitle
          : financeCopy.page.subtitle,
      }}
      tabs={{
        defaultValue: canAnalytics && !isClientPortal ? "summary" : "invoices",
        value: activeTab,
        onValueChange: handleTabChange,
        items: tabs,
      }}
    />
  );
}
