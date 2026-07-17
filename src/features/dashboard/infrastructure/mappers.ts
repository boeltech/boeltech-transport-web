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

function mapBranchKpisTrips(raw: Record<string, unknown>) {
  return {
    total: asNumber(raw.total),
    inProgress: asNumber(raw.in_progress),
    completed: asNumber(raw.completed),
    cancelled: asNumber(raw.cancelled),
  };
}

function mapBranchKpisFleet(raw: Record<string, unknown>) {
  return {
    vehiclesTotal: asNumber(raw.vehicles_total),
    vehiclesAvailable: asNumber(raw.vehicles_available),
    vehiclesOnTrip: asNumber(raw.vehicles_on_trip),
    vehiclesInMaintenance: asNumber(raw.vehicles_in_maintenance),
  };
}

function mapBranchKpisDrivers(raw: Record<string, unknown>) {
  return {
    total: asNumber(raw.total),
    available: asNumber(raw.available),
    onTrip: asNumber(raw.on_trip),
  };
}

function mapBranchKpisFinancialMonth(
  raw: Record<string, unknown> | null | undefined,
) {
  if (!raw) return null;
  const actualRevenue = asNumber(raw.actual_revenue);
  const actualCost = asNumber(raw.actual_cost);
  return {
    tripCount: asNumber(raw.trip_count),
    actualRevenue,
    actualCost,
    actualMargin: asNumber(raw.actual_margin) || actualRevenue - actualCost,
  };
}

export function mapBranchKpis(raw: Record<string, unknown>) {
  const periodRaw = (raw.period ?? {}) as Record<string, unknown>;
  const rowsRaw = Array.isArray(raw.rows) ? raw.rows : [];

  return {
    period: {
      from: asString(periodRaw.from),
      to: asString(periodRaw.to),
      label: asString(periodRaw.label) || "Mes actual",
    },
    rows: rowsRaw.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        branchId:
          row.branch_id == null || row.branch_id === ""
            ? null
            : asString(row.branch_id),
        branchCode:
          row.branch_code == null || row.branch_code === ""
            ? null
            : asString(row.branch_code),
        branchName: asString(row.branch_name) || "Sin sucursal",
        trips: mapBranchKpisTrips(
          (row.trips ?? {}) as Record<string, unknown>,
        ),
        fleet: mapBranchKpisFleet(
          (row.fleet ?? {}) as Record<string, unknown>,
        ),
        drivers: mapBranchKpisDrivers(
          (row.drivers ?? {}) as Record<string, unknown>,
        ),
        financialMonth: mapBranchKpisFinancialMonth(
          row.financial_month as Record<string, unknown> | null | undefined,
        ),
      };
    }),
  };
}

function mapNumberArray(value: unknown): number[] {
  return Array.isArray(value) ? value.map((v) => asNumber(v)) : [];
}

export function mapBranchKpisTrend(raw: Record<string, unknown>) {
  const periods = Array.isArray(raw.periods)
    ? raw.periods.map((p) => asString(p))
    : [];
  const seriesRaw = Array.isArray(raw.series) ? raw.series : [];

  return {
    months: asNumber(raw.months) || periods.length,
    periods,
    series: seriesRaw.map((item) => {
      const row = item as Record<string, unknown>;
      const financialRaw = row.financial as Record<string, unknown> | null | undefined;
      return {
        branchId:
          row.branch_id == null || row.branch_id === ""
            ? null
            : asString(row.branch_id),
        branchCode:
          row.branch_code == null || row.branch_code === ""
            ? null
            : asString(row.branch_code),
        branchName: asString(row.branch_name) || "Sin sucursal",
        tripsCompleted: mapNumberArray(row.trips_completed),
        financial:
          financialRaw == null
            ? null
            : {
                actualRevenue: mapNumberArray(financialRaw.actual_revenue),
                actualCost: mapNumberArray(financialRaw.actual_cost),
                actualMargin: mapNumberArray(financialRaw.actual_margin),
              },
      };
    }),
  };
}
