/**
 * Settlements Domain Enums
 * Clean Architecture - Domain Layer
 *
 * Enums and Value Types for Compensation, Advances and Settlements.
 */

// ============================================================================
// CALCULATION TYPES FOR COMPENSATION AGREEMENTS
// ============================================================================

export type CompensationCalculationType =
  | "fixed_per_trip"
  | "rate_per_km"
  | "percentage_of_freight"
  | "fixed_daily_rate"
  | "salary_only";

export const COMPENSATION_CALCULATION_TYPE_LABELS: Record<
  CompensationCalculationType,
  string
> = {
  fixed_per_trip: "Tarifa fija por viaje",
  rate_per_km: "Tarifa por kilómetro",
  percentage_of_freight: "Porcentaje sobre flete",
  fixed_daily_rate: "Tarifa diaria (ayudante/apoyo)",
  salary_only: "Solo sueldo base",
};

// ============================================================================
// COMPOSITE COMPENSATION AGREEMENT TYPES (ADR-0086)
// ============================================================================

export type TripRouteType = "local" | "long_haul" | "transfer";

export const TRIP_ROUTE_TYPE_LABELS: Record<TripRouteType, string> = {
  local: "Local",
  long_haul: "Foráneo",
  transfer: "Transfer / Patio",
};

export type CompensationSalaryPeriod = "weekly" | "biweekly" | "monthly" | "none";

export const COMPENSATION_SALARY_PERIOD_LABELS: Record<
  CompensationSalaryPeriod,
  string
> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  none: "Sin sueldo fijo",
};

export type AgreementCommissionType =
  | "rate_per_km"
  | "percentage_of_freight"
  | "fixed_per_trip"
  | "none";

export const AGREEMENT_COMMISSION_TYPE_LABELS: Record<
  AgreementCommissionType,
  string
> = {
  rate_per_km: "Tarifa por kilómetro",
  percentage_of_freight: "Porcentaje sobre flete",
  fixed_per_trip: "Monto fijo por viaje",
  none: "Sin comisión (cubierto por sueldo base)",
};

// ============================================================================
// DRIVER ADVANCE ENUMS
// ============================================================================

export type AdvanceCategory =
  | "travel_advance"
  | "fuel"
  | "tolls"
  | "per_diem"
  | "cash_advance"
  | "emergency"
  | "loan";

export const ADVANCE_CATEGORY_LABELS: Record<AdvanceCategory, string> = {
  travel_advance: "Anticipo de viaje",
  fuel: "Combustible",
  tolls: "Casetas / Peajes",
  per_diem: "Viáticos",
  cash_advance: "Efectivo / Préstamo",
  emergency: "Emergencia en ruta",
  loan: "Préstamo",
};

export type MidTripPayoutPolicy =
  | "split_by_assigned_km"
  | "equal_parts"
  | "pay_only_closer"
  | "pay_only_dispatcher";

export const MID_TRIP_PAYOUT_POLICY_LABELS: Record<MidTripPayoutPolicy, string> = {
  split_by_assigned_km: "Prorrateo por km asignados",
  equal_parts: "Partes iguales",
  pay_only_closer: "Solo quien cierra el viaje",
  pay_only_dispatcher: "Solo quien despacha",
};

export const DEFAULT_MID_TRIP_PAYOUT_POLICY: MidTripPayoutPolicy =
  "split_by_assigned_km";

/** D13 — VoBo por defecto desde el primer peso. */
export const DEFAULT_VOBO_THRESHOLD_MXN = 0;

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  fuel: "Combustible",
  tolls: "Casetas / Peajes",
  driver_allowance: "Alimentos y viáticos",
  lodging: "Hospedaje",
  loading_unloading: "Maniobras de carga / descarga",
  parking: "Pensión / Estacionamiento",
  maintenance: "Mantenimiento menor",
  insurance: "Seguros",
  permits: "Permisos y trámites",
  other: "Otros gastos",
};

export type AdvanceStatus =
  | "draft"
  | "pending_approval"
  | "pending_disbursement"
  | "disbursed"
  | "partially_applied"
  | "fully_applied"
  | "rejected"
  | "cancelled";

export const ADVANCE_STATUS_LABELS: Record<AdvanceStatus, string> = {
  draft: "Borrador",
  pending_approval: "Por autorizar",
  pending_disbursement: "Autorizado (pendiente entrega)",
  disbursed: "Entregado (abierto)",
  partially_applied: "Parcialmente descontado",
  fully_applied: "Descontado al 100%",
  rejected: "Rechazado",
  cancelled: "Cancelado",
};

// ============================================================================
// SETTLEMENT STATUS ENUMS
// ============================================================================

export type SettlementStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "disbursed"
  | "rejected"
  | "cancelled";

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  draft: "Borrador",
  pending_approval: "Por autorizar",
  approved: "Autorizada",
  disbursed: "Pagada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

// ============================================================================
// SETTLEMENT ITEM TYPES
// ============================================================================

export type SettlementItemType =
  | "trip_commission"
  | "base_salary"
  | "approved_expense_reimbursement"
  | "advance_deduction"
  | "bonus"
  | "penalty_deduction"
  | "tax_deduction"
  | "adjustment";

export const SETTLEMENT_ITEM_TYPE_LABELS: Record<SettlementItemType, string> = {
  trip_commission: "Pago por viaje",
  base_salary: "Sueldo base",
  approved_expense_reimbursement: "Gastos y casetas reembolsables",
  advance_deduction: "Descuento de anticipo",
  bonus: "Bono / Incentivo",
  penalty_deduction: "Deducción / Penalización",
  tax_deduction: "Retención / Impuesto",
  adjustment: "Ajuste manual",
};

export type DisbursementMethod =
  | "bank_transfer"
  | "check"
  | "cash"
  | "electronic_wallet";

export const DISBURSEMENT_METHOD_LABELS: Record<DisbursementMethod, string> = {
  bank_transfer: "Transferencia bancaria (SPEI)",
  check: "Cheque",
  cash: "Efectivo",
  electronic_wallet: "Monedero / Tarjeta",
};
