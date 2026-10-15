/**
 * Query keys del dashboard — contrato de invalidación (hub approvals → dashboard).
 */
export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardQueryKeys.all, "stats"] as const,
  tripsByDay: (days: number) =>
    [...dashboardQueryKeys.all, "trips-by-day", days] as const,
  financialTrend: (months: number) =>
    [...dashboardQueryKeys.all, "financial-trend", months] as const,
  branchKpis: (
    branchIds?: string[],
    includeUnassigned?: boolean,
    period: string = "current_month",
  ) =>
    [
      ...dashboardQueryKeys.all,
      "branch-kpis",
      branchIds ?? [],
      includeUnassigned ?? false,
      period,
    ] as const,
  branchKpisTrend: (
    months: number,
    branchIds?: string[],
    includeUnassigned?: boolean,
  ) =>
    [
      ...dashboardQueryKeys.all,
      "branch-kpis-trend",
      months,
      branchIds ?? [],
      includeUnassigned ?? false,
    ] as const,
};
