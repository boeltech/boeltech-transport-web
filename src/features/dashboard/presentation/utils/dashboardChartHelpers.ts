export {
  filterNonZeroChartSlices,
  financeCountValueFormatter,
  financeCurrencyValueFormatter,
} from "@features/finance/presentation/utils/financeChartHelpers";

export function formatDashboardDayLabel(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export function formatDashboardTodayLabel(): string {
  return new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function sumTripsByDayPoints(
  points: { completed: number; cancelled: number; inProgress: number }[],
): { completed: number; cancelled: number; inProgress: number } {
  return points.reduce(
    (acc, point) => ({
      completed: acc.completed + point.completed,
      cancelled: acc.cancelled + point.cancelled,
      inProgress: acc.inProgress + point.inProgress,
    }),
    { completed: 0, cancelled: 0, inProgress: 0 },
  );
}
