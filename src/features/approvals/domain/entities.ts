import type { Pagination } from "@shared/api";

export type ApprovableType =
  | "trip_expense"
  | "internal_staff_compensation"
  | "fuel_transaction"
  | "maintenance_order"
  | "vehicle_doc_renewal"
  | "overhead_expense";

export type ApprovalStatus =
  | "pending"
  | "documented"
  | "approved"
  | "rejected";

export interface TripExpenseContext {
  approvableType: "trip_expense";
  tripId: string;
  tripCode: string;
  driverId: string | null;
  driverFullName: string | null;
  vehicleId: string | null;
  vehicleUnitNumber: string | null;
  expenseCategory: string;
  description: string | null;
  occurredAt: string;
}

export interface InternalStaffCompensationContext {
  approvableType: "internal_staff_compensation";
}

export interface FuelTransactionContext {
  approvableType: "fuel_transaction";
}

export interface MaintenanceOrderContext {
  approvableType: "maintenance_order";
}

export interface VehicleDocRenewalContext {
  approvableType: "vehicle_doc_renewal";
}

export interface OverheadExpenseContext {
  approvableType: "overhead_expense";
}

export type ApprovableContext =
  | TripExpenseContext
  | InternalStaffCompensationContext
  | FuelTransactionContext
  | MaintenanceOrderContext
  | VehicleDocRenewalContext
  | OverheadExpenseContext;

export interface ApprovableItem {
  approvableType: ApprovableType;
  id: string;
  amount: number;
  currency: "MXN" | "USD" | "EUR";
  category: string;
  status: ApprovalStatus;
  submittedAt: string;
  submittedBy: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  context: ApprovableContext;
}

export interface ListApprovalsFilters {
  type: ApprovableType;
  status?: ApprovalStatus;
  category?: string;
  tripId?: string;
  driverId?: string;
  vehicleId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedApprovals {
  data: ApprovableItem[];
  pagination: Pagination;
}

export interface BulkOperation {
  type: ApprovableType;
  id: string;
  action: "approve" | "reject";
  reason?: string;
}

export interface BulkSuccess {
  type: ApprovableType;
  id: string;
  item: ApprovableItem;
}

export interface BulkFailure {
  type: ApprovableType;
  id: string;
  error: {
    code: string;
    message: string;
  };
}

export interface BulkResult {
  successes: BulkSuccess[];
  failures: BulkFailure[];
}

export const APPROVABLE_ACTIONABLE_STATUSES: readonly ApprovalStatus[] = [
  "pending",
  "documented",
];

export function isApprovableActionable(item: ApprovableItem): boolean {
  return APPROVABLE_ACTIONABLE_STATUSES.includes(item.status);
}
