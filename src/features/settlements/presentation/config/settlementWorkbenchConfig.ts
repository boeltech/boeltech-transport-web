/**
 * Configuración del workbench de pagos a operadores (Capa 1 handoff 2026-09-01).
 * Layout KPI chips: deprecado — usar mapSettlementWorkbenchBuckets + WorkbenchPageShell (ADR-0090).
 */

import type { SettlementStatus } from "../../domain/enums";

/** Cubetas navegables en el KPI strip (autorización → tab Por autorizar del hub). */
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

const PENDING_APPROVAL_PATH = "/finance/settlements/pending-approval";

/** Deep-link de pagos por autorizar → tab hub (D-A). */
export function settlementsCompensationApprovalsPath(params?: {
  driverId?: string;
}): string {
  if (!params?.driverId) return PENDING_APPROVAL_PATH;
  const qs = new URLSearchParams({ driverId: params.driverId });
  return `${PENDING_APPROVAL_PATH}?${qs.toString()}`;
}

/** Anticipos siguen en la bandeja global de Aprobaciones. */
export function settlementsDriverAdvanceApprovalsPath(): string {
  return "/finance/approvals?type=driver_advance_request&status=pending";
}

export function resolveDefaultWorkbenchBucket(): SettlementWorkbenchNavBucket {
  return "pending";
}
