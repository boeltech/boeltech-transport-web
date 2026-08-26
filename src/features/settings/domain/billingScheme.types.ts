/** ADR-0082 — esquemas de facturación (cadencia / corrida). */

export const BILLING_CADENCE_KINDS = [
  "event",
  "periodic_weekly",
  "periodic_decadal",
  "periodic_monthly",
] as const;

export type BillingCadenceKind = (typeof BILLING_CADENCE_KINDS)[number];

export type BillingSchemeParams =
  | { windowHours: number }
  | { weekdays: number[] }
  | { monthDays: number[] }
  | { businessDaysFromMonthStart: number };

export interface BillingScheme {
  id: string;
  tenantId: string;
  name: string;
  cadenceKind: BillingCadenceKind;
  params: BillingSchemeParams;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillingSchemePayload {
  name: string;
  cadenceKind: BillingCadenceKind;
  params: Record<string, unknown>;
  isDefault?: boolean;
}

export interface UpdateBillingSchemePayload {
  name?: string;
  cadenceKind?: BillingCadenceKind;
  params?: Record<string, unknown>;
  isDefault?: boolean;
}
