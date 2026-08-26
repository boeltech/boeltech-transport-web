import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CircleDollarSign,
  GitBranch,
  LayoutDashboard,
  TrendingUp,
  Wallet,
} from "lucide-react";
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
  icon: LucideIcon;
  isVisible: (ctx: ReportsHubAccessContext) => boolean;
}

const copy = reportsCopy.catalog.items;

export const REPORTS_CATALOG_ITEMS: readonly ReportsCatalogItemDefinition[] = [
  {
    id: "margin",
    group: "financial",
    title: copy.margin.title,
    description: copy.margin.description,
    href: "/finance/analysis?view=margin",
    icon: TrendingUp,
    isVisible: (ctx) => ctx.canFinanceAnalytics,
  },
  {
    id: "receivables",
    group: "financial",
    title: copy.receivables.title,
    description: copy.receivables.description,
    href: "/finance",
    icon: Wallet,
    isVisible: (ctx) => ctx.canFinanceAnalytics,
  },
  {
    id: "expenses",
    group: "financial",
    title: copy.expenses.title,
    description: copy.expenses.description,
    href: "/finance/analysis?view=expenses",
    icon: CircleDollarSign,
    isVisible: (ctx) => ctx.canFinanceAnalytics,
  },
  {
    id: "operations",
    group: "operational",
    title: copy.operations.title,
    description: copy.operations.description,
    href: "/dashboard",
    icon: LayoutDashboard,
    isVisible: (ctx) => ctx.canReadTrips,
  },
  {
    id: "branches",
    group: "operational",
    title: copy.branches.title,
    description: copy.branches.description,
    href: "/dashboard",
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
