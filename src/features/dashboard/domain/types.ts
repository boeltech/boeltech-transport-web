/**
 * Dashboard Types
 * Clean Architecture - Domain Layer
 *
 * Tipos para el módulo del dashboard.
 */

// ============================================
// Stats Types
// ============================================

export interface DashboardStats {
  vehicles: {
    total: number;
    available: number;
    on_trip: number;
    in_maintenance: number;
  };
  drivers: {
    total: number;
    available: number;
    on_trip: number;
    on_vacation: number;
    on_leave: number;
  };
  trips: {
    total_this_month: number;
    in_progress: number;
    completed_this_month: number;
    cancelled_this_month: number;
  };
  billing: {
    total_cost_this_month: number;
    total_base_rate_this_month: number;
  } | null;
  /** Null cuando el rol no tiene finance.read (API D9 / branch-kpis). */
  financial_month: FinancialMonth | null;
}

export interface FinancialMonth {
  trip_count: number;
  budgeted_revenue: number;
  actual_revenue: number;
  budgeted_cost: number;
  actual_cost: number;
  budgeted_margin: number;
  actual_margin: number;
  revenue_variance: number;
  cost_variance: number;
  margin_variance: number;
  trips_with_pending_expenses: number;
}

export interface FinancialTrendData {
  periods: string[];
  budgeted_revenue: number[];
  actual_revenue: number[];
  budgeted_cost: number[];
  actual_cost: number[];
  /** Mes en curso según el API (`YYYY-MM`); es el último de `periods`. */
  currentPeriod?: string;
}

// ============================================
// Alert Types
// ============================================

export type AlertType =
  | "overdue_trip"
  | "license_expiring"
  | "medical_certificate_expiring"
  | "insurance_expiring"
  | "sct_permit_expiring";

export type AlertSeverity = "error" | "warning" | "info";

export interface DashboardAlert {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  entity_id: string;
  entity_code?: string;
}

// ============================================
// Recent Trips Types
// ============================================

export interface RecentTrip {
  id: string;
  trip_code: string;
  origin_city: string;
  destination_city: string;
  status: string;
  scheduled_departure: string;
  driver_full_name: string;
  vehicle_unit_number: string;
}

// ============================================
// Dashboard Response
// ============================================

export interface DashboardData {
  stats: DashboardStats;
  alerts: DashboardAlert[];
  recent_trips: RecentTrip[];
}

export interface TripsByDayPoint {
  day: string;
  completed: number;
  cancelled: number;
  inProgress: number;
  total: number;
}

export interface TripsByDayData {
  points: TripsByDayPoint[];
}

export interface BranchKpisPeriod {
  from: string;
  to: string;
  label: string;
}

export const BRANCH_KPIS_PERIOD_VALUES = [
  "current_month",
  "last_30",
  "last_90",
] as const;

export type BranchKpisPeriodValue =
  (typeof BRANCH_KPIS_PERIOD_VALUES)[number];

export const DEFAULT_BRANCH_KPIS_PERIOD: BranchKpisPeriodValue =
  "current_month";

export interface BranchKpisTrips {
  total: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export interface BranchKpisFleet {
  vehiclesTotal: number;
  vehiclesAvailable: number;
  vehiclesOnTrip: number;
  vehiclesInMaintenance: number;
}

export interface BranchKpisDrivers {
  total: number;
  available: number;
  onTrip: number;
}

export interface BranchKpisFinancialMonth {
  tripCount: number;
  actualRevenue: number;
  actualCost: number;
  actualMargin: number;
}

export interface BranchKpisRow {
  branchId: string | null;
  branchCode: string | null;
  branchName: string;
  trips: BranchKpisTrips;
  fleet: BranchKpisFleet;
  drivers: BranchKpisDrivers;
  financialMonth: BranchKpisFinancialMonth | null;
}

export interface BranchKpisData {
  period: BranchKpisPeriod;
  rows: BranchKpisRow[];
}

export type BranchKpisSelectionToken = string | "unassigned";

export type BranchKpisTrendMonths = 6 | 12;

export interface BranchKpisTrendFinancial {
  actualRevenue: number[];
  actualCost: number[];
  actualMargin: number[];
}

export interface BranchKpisTrendSeries {
  branchId: string | null;
  branchCode: string | null;
  branchName: string;
  tripsCompleted: number[];
  financial: BranchKpisTrendFinancial | null;
}

export interface BranchKpisTrendData {
  months: number;
  periods: string[];
  series: BranchKpisTrendSeries[];
}

// ============================================
// Activation checklist (F1 onboarding guiado)
// ============================================

export type ActivationOpsLevel = "empty" | "l1_ready" | "l1_complete";

export type ActivationItemCode =
  | "client"
  | "vehicle"
  | "driver"
  | "first_trip"
  | "company_fiscal"
  | "csd_pac"
  | "invite_team";

export type ActivationItemStatus = "pending" | "done" | "skipped";

export type ActivationReadyHint =
  | "missing_rfc"
  | "missing_csd"
  | "ready_for_config"
  | "configured";

export interface ActivationCounts {
  clients: number;
  vehicles: number;
  drivers: number;
  tripsNonCancelled: number;
  usersNonAdmin: number;
}

export interface ActivationFiscalTrack {
  companyRfcSet: boolean;
  certificateConfigured: boolean;
  readyHint: ActivationReadyHint;
}

export interface ActivationItem {
  code: ActivationItemCode;
  status: ActivationItemStatus;
  requiredForOps: boolean;
  ctaPath: string;
  canAct: boolean;
}

export interface ActivationDemo {
  hasDemoData: boolean;
  seedAvailable: boolean;
  purgeAllowed: boolean;
}

export interface ActivationData {
  opsLevel: ActivationOpsLevel;
  fiscalTrack: ActivationFiscalTrack;
  counts: ActivationCounts;
  items: ActivationItem[];
  demo: ActivationDemo;
  /** API F1 siempre false; dismiss es localStorage en web. */
  dismissed: boolean;
}

/** Pack code for POST /setup/demo-seed (F2). */
export const DEMO_OPS_PACK = "demo_ops_v1" as const;
export type DemoOpsPack = typeof DEMO_OPS_PACK;

/** Literal confirm body for POST /setup/demo-seed:purge. */
export const DEMO_PURGE_CONFIRM = "PURGE_DEMO" as const;

export type DemoSeedRunStatus = "completed" | "purged";

export interface DemoSeedStatus {
  pack: string | null;
  status: DemoSeedRunStatus | null;
  hasDemoData: boolean;
  seedAvailable: boolean;
  purgeAllowed: boolean;
  includeDraftTrip: boolean | null;
  entityCounts: Record<string, number>;
  createdAt: string | null;
}

export interface DemoSeedApplyResult {
  runId: string;
  pack: string;
  status: "completed";
  includeDraftTrip: boolean;
  entityCounts: Record<string, number>;
  entityIds: Array<{ entityType: string; entityId: string }>;
}

export interface DemoSeedPurgeResult {
  runId: string;
  pack: string;
  status: "purged";
  purgedEntityCounts: Record<string, number>;
}

// ============================================
// UI Constants
// ============================================

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  overdue_trip: "Viaje vencido",
  license_expiring: "Licencia por vencer",
  medical_certificate_expiring: "Certificado médico por vencer",
  insurance_expiring: "Seguro por vencer",
  sct_permit_expiring: "Permiso SCT por vencer",
};
