function asString(value: unknown): string {
  return value == null ? "" : String(value);
}

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapFinancialTrend(raw: Record<string, unknown>) {
  const periods = Array.isArray(raw.periods)
    ? raw.periods.map((p) => asString(p))
    : [];

  return {
    periods,
    budgeted_revenue: Array.isArray(raw.budgeted_revenue)
      ? raw.budgeted_revenue.map((v) => asNumber(v))
      : [],
    actual_revenue: Array.isArray(raw.actual_revenue)
      ? raw.actual_revenue.map((v) => asNumber(v))
      : [],
    budgeted_cost: Array.isArray(raw.budgeted_cost)
      ? raw.budgeted_cost.map((v) => asNumber(v))
      : [],
    actual_cost: Array.isArray(raw.actual_cost)
      ? raw.actual_cost.map((v) => asNumber(v))
      : [],
  };
}

export function mapTripsByDay(raw: Record<string, unknown>) {
  const pointsRaw = Array.isArray(raw.points) ? raw.points : [];
  return {
    points: pointsRaw.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        day: asString(row.day),
        completed: asNumber(row.completed),
        cancelled: asNumber(row.cancelled),
        inProgress: asNumber(row.in_progress),
        total: asNumber(row.total),
      };
    }),
  };
}
