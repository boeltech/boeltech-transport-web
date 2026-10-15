import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarRange,
  CircleDollarSign,
  GitBranch,
  LayoutDashboard,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  buildFinanceAnalysisHref,
  FINANCE_HUB_PATH,
} from "@features/finance/application";
import { DASHBOARD_PATH } from "@shared/utils/reportsWayfinding";
import { reportsCopy } from "../copy/reportsCopy";

export type ReportsCatalogGroupId = "financial" | "operational";

export interface ReportsHubAccessContext {
  canFinanceAnalytics: boolean;
  canReadTrips: boolean;
  canReadBranches: boolean;
}

export interface ReportsCatalogItemDefinition {
  id: string;
  group: ReportsCatalogGroupId;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  isVisible: (ctx: ReportsHubAccessContext) => boolean;
}

const copy = reportsCopy.catalog.items;

export const REPORTS_CATALOG_ITEMS: readonly ReportsCatalogItemDefinition[] = [
  {
    id: "performance",
    group: "financial",
    title: copy.performance.title,
    description: copy.performance.description,
    href: buildFinanceAnalysisHref("performance"),
    cta: reportsCopy.catalog.viewPerformanceCta,
    icon: CalendarRange,
    isVisible: (ctx) => ctx.canFinanceAnalytics,
  },
  {
    id: "margin",
    group: "financial",
    title: copy.margin.title,
    description: copy.margin.description,
    href: buildFinanceAnalysisHref("margin"),
    cta: reportsCopy.catalog.viewAnalysisCta,
    icon: TrendingUp,
    isVisible: (ctx) => ctx.canFinanceAnalytics,
  },
  {
    id: "receivables",
    group: "financial",
    title: copy.receivables.title,
    description: copy.receivables.description,
    href: FINANCE_HUB_PATH,
    cta: reportsCopy.catalog.viewCarteraCta,
    icon: Wallet,
    isVisible: (ctx) => ctx.canFinanceAnalytics,
  },
  {
    id: "expenses",
    group: "financial",
    title: copy.expenses.title,
    description: copy.expenses.description,
    href: buildFinanceAnalysisHref("expenses"),
    cta: reportsCopy.catalog.viewAnalysisCta,
    icon: CircleDollarSign,
    isVisible: (ctx) => ctx.canFinanceAnalytics,
  },
  {
    id: "operations",
    group: "operational",
    title: copy.operations.title,
    description: copy.operations.description,
    href: DASHBOARD_PATH,
    cta: reportsCopy.catalog.viewDashboardCta,
    icon: LayoutDashboard,
    isVisible: (ctx) => ctx.canReadTrips,
  },
  {
    id: "branches",
    group: "operational",
    title: copy.branches.title,
    description: copy.branches.description,
    href: DASHBOARD_PATH,
    cta: reportsCopy.catalog.viewBranchKpisCta,
    icon: GitBranch,
    isVisible: (ctx) => ctx.canReadTrips && ctx.canReadBranches,
  },
] as const;

export function getVisibleReportsCatalogItems(
  ctx: ReportsHubAccessContext,
): ReportsCatalogItemDefinition[] {
  return REPORTS_CATALOG_ITEMS.filter((item) => item.isVisible(ctx));
}

export function getReportsCatalogItemsByGroup(
  ctx: ReportsHubAccessContext,
): Record<ReportsCatalogGroupId, ReportsCatalogItemDefinition[]> {
  const visible = getVisibleReportsCatalogItems(ctx);
  return {
    financial: visible.filter((item) => item.group === "financial"),
    operational: visible.filter((item) => item.group === "operational"),
  };
}

export const REPORTS_HUB_PAGE_ICON = BarChart3;
