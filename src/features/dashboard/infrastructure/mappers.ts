import type {
  ActivationData,
  ActivationItem,
  ActivationItemCode,
  ActivationItemStatus,
  ActivationOpsLevel,
  ActivationReadyHint,
  DashboardAlert,
  DashboardData,
  DashboardStats,
  RecentTrip,
} from "../domain/types";

function asString(value: unknown): string {
  return value == null ? "" : String(value);
}

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

const ACTIVATION_OPS_LEVELS = new Set<ActivationOpsLevel>([
  "empty",
  "l1_ready",
  "l1_complete",
]);

const ACTIVATION_ITEM_CODES = new Set<ActivationItemCode>([
  "client",
  "vehicle",
  "driver",
  "first_trip",
  "company_fiscal",
  "csd_pac",
  "invite_team",
]);

const ACTIVATION_ITEM_STATUSES = new Set<ActivationItemStatus>([
  "pending",
  "done",
  "skipped",
]);

const ACTIVATION_READY_HINTS = new Set<ActivationReadyHint>([
  "missing_rfc",
  "missing_csd",
  "ready_for_config",
  "configured",
]);

function asOpsLevel(value: unknown): ActivationOpsLevel {
  const raw = asString(value) as ActivationOpsLevel;
  return ACTIVATION_OPS_LEVELS.has(raw) ? raw : "empty";
}

function asItemCode(value: unknown): ActivationItemCode | null {
  const raw = asString(value) as ActivationItemCode;
  return ACTIVATION_ITEM_CODES.has(raw) ? raw : null;
}

function asItemStatus(value: unknown): ActivationItemStatus {
  const raw = asString(value) as ActivationItemStatus;
  return ACTIVATION_ITEM_STATUSES.has(raw) ? raw : "pending";
}

function asReadyHint(value: unknown): ActivationReadyHint {
  const raw = asString(value) as ActivationReadyHint;
  return ACTIVATION_READY_HINTS.has(raw) ? raw : "missing_rfc";
}

function mapActivationItem(raw: Record<string, unknown>): ActivationItem | null {
  const code = asItemCode(raw.code);
  if (!code) return null;
  return {
    code,
    status: asItemStatus(raw.status),
    requiredForOps: asBoolean(raw.required_for_ops),
    ctaPath: asString(raw.cta_path) || "/",
    canAct: asBoolean(raw.can_act),
  };
}

/**
 * GET /dashboard — conserva el shape legacy snake_case de stats/alerts/recent
 * y mapea los campos Aurora F1 a camelCase (`collectedYesterday`, `tripsToday`).
 */
export function mapDashboard(raw: Record<string, unknown>): DashboardData {
  const statsRaw = (raw.stats ?? {}) as Record<string, unknown>;
  const collectedRaw = statsRaw.collected_yesterday;
  const collectedYesterday =
    collectedRaw === null || collectedRaw === undefined
      ? null
      : asNumber(collectedRaw);

  const stats = {
    ...(statsRaw as Omit<DashboardStats, "collectedYesterday">),
    collectedYesterday,
  } as DashboardStats;

  return {
    stats,
    alerts: (Array.isArray(raw.alerts) ? raw.alerts : []) as DashboardAlert[],
    recent_trips: (Array.isArray(raw.recent_trips)
      ? raw.recent_trips
      : []) as RecentTrip[],
    tripsToday: (Array.isArray(raw.trips_today)
      ? raw.trips_today
      : []) as RecentTrip[],
  };
}

export function mapActivation(raw: Record<string, unknown>): ActivationData {
  const countsRaw = (raw.counts ?? {}) as Record<string, unknown>;
  const fiscalRaw = (raw.fiscal_track ?? {}) as Record<string, unknown>;
  const demoRaw = (raw.demo ?? {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];

  return {
    opsLevel: asOpsLevel(raw.ops_level),
    fiscalTrack: {
      companyRfcSet: asBoolean(fiscalRaw.company_rfc_set),
      certificateConfigured: asBoolean(fiscalRaw.certificate_configured),
      readyHint: asReadyHint(fiscalRaw.ready_hint),
    },
    counts: {
      clients: asNumber(countsRaw.clients),
      vehicles: asNumber(countsRaw.vehicles),
      drivers: asNumber(countsRaw.drivers),
      tripsNonCancelled: asNumber(countsRaw.trips_non_cancelled),
      usersNonAdmin: asNumber(countsRaw.users_non_admin),
    },
    items: itemsRaw
      .map((item) => mapActivationItem(item as Record<string, unknown>))
      .filter((item): item is ActivationItem => item != null),
    demo: {
      hasDemoData: asBoolean(demoRaw.has_demo_data),
      seedAvailable: asBoolean(demoRaw.seed_available),
      purgeAllowed: asBoolean(demoRaw.purge_allowed),
    },
    dismissed: asBoolean(raw.dismissed),
  };
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
    currentPeriod: asString(raw.current_period) || undefined,
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
