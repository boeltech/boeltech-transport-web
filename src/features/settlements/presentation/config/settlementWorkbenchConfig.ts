/**
 * Configuración del workbench de liquidaciones (Capa 1 handoff 2026-09-01).
 * Layout KPI chips: deprecado — usar mapSettlementWorkbenchBuckets + WorkbenchPageShell (ADR-0090).
 */

import type { SettlementStatus } from "../../domain/enums";

/** Cubetas navegables en el KPI strip (sin autorización — va a bandeja central). */
export type SettlementWorkbenchNavBucket =
  | "pending"
  | "draft"
  | "payable"
  | "closed";

/** Incluye `approval` para contadores y URLs legacy. */
export type SettlementWorkbenchBucket =
  | SettlementWorkbenchNavBucket
  | "approval";

export const SETTLEMENT_WORKBENCH_BUCKETS: SettlementWorkbenchNavBucket[] = [
  "pending",
  "draft",
  "payable",
  "closed",
];

export const SETTLEMENT_REGISTRY_VIEW = "registry";

/** Estados agrupados por etapa KPI (excepto pending y approval). */
export const BUCKET_PIPELINE_STATUSES: Record<
  Exclude<SettlementWorkbenchNavBucket, "pending">,
  readonly SettlementStatus[]
> = {
  draft: ["draft", "rejected"],
  payable: ["approved"],
  closed: ["disbursed"],
};

export const OPEN_ADVANCE_STATUSES = [
  "pending_disbursement",
  "disbursed",
  "partially_applied",
] as const;

export function settlementsCompensationApprovalsPath(): string {
  return "/finance/approvals?type=internal_staff_compensation&status=pending";
}

export function settlementsDriverAdvanceApprovalsPath(): string {
  return "/finance/approvals?type=driver_advance_request&status=pending";
}

export function resolveDefaultWorkbenchBucket(): SettlementWorkbenchNavBucket {
  return "pending";
}
