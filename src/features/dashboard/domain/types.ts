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
  };
  financial_month: FinancialMonth;
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
