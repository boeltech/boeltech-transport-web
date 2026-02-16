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
}

export type AlertType =
  | "overdue_trip"
  | "license_expiring"
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

export interface DashboardData {
  stats: DashboardStats;
  alerts: DashboardAlert[];
  recent_trips: RecentTrip[];
}
