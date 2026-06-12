import type { ApprovableType, ApprovalStatus } from "./entities";

export const DEFAULT_APPROVAL_TYPE: ApprovableType = "trip_expense";

export const APPROVABLE_TYPE_LABELS: Record<ApprovableType, string> = {
  trip_expense: "Gasto de viaje",
  internal_staff_compensation: "Compensación interna",
  fuel_transaction: "Combustible",
  maintenance_order: "Orden de mantenimiento",
  vehicle_doc_renewal: "Renovación documental",
  overhead_expense: "Gasto corporativo",
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "Pendiente",
  documented: "Documentado",
  approved: "Aprobado",
  rejected: "Rechazado",
};
