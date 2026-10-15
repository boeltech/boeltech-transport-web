/**
 * Configuración del workbench de pagos a operadores (Capa 1 handoff 2026-09-01).
 * Layout KPI chips: deprecado — usar mapSettlementWorkbenchBuckets + WorkbenchPageShell (ADR-0090).
 */

import { FINANCE_APPROVALS_PATH } from "@features/finance/application";
import type { SettlementStatus } from "../../domain/enums";
import { settlementsWorkbenchBucketPath } from "../../application/settlementsRoutes";

/** Cubetas navegables en el KPI strip (incl. En autorización = pipeline `pending_approval`). */
export type SettlementWorkbenchNavBucket =
  | "pending"
  | "draft"
  | "approval"
  | "payable"
  | "closed";

/** Alias histórico; hoy coincide con las cubetas navegables. */
export type SettlementWorkbenchBucket = SettlementWorkbenchNavBucket;

export const SETTLEMENT_WORKBENCH_BUCKETS: SettlementWorkbenchNavBucket[] = [
  "pending",
  "draft",
  "approval",
  "payable",
  "closed",
];

export const SETTLEMENT_REGISTRY_VIEW = "registry";

/** Estados agrupados por etapa KPI (excepto pending). */
export const BUCKET_PIPELINE_STATUSES: Record<
  Exclude<SettlementWorkbenchNavBucket, "pending">,
  readonly SettlementStatus[]
> = {
  draft: ["draft", "rejected"],
  approval: ["pending_approval"],
  payable: ["approved"],
  closed: ["disbursed"],
};

export const OPEN_ADVANCE_STATUSES = [
  "pending_disbursement",
  "disbursed",
  "partially_applied",
] as const;

/** Anticipos siguen en la bandeja global de Aprobaciones. */
export function settlementsDriverAdvanceApprovalsPath(): string {
  return `${FINANCE_APPROVALS_PATH}?type=driver_advance_request&status=pending`;
}

/** Bandeja global de liquidaciones (módulo Aprobaciones). */
export function settlementsApprovalsInboxPath(): string {
  return `${FINANCE_APPROVALS_PATH}?type=internal_staff_compensation&status=pending`;
}

export function resolveDefaultWorkbenchBucket(): SettlementWorkbenchNavBucket {
  return "pending";
}

/** Redirect canónico desde la ruta legacy del tab Por autorizar. */
export function settlementsPendingApprovalRedirectPath(search?: string): string {
  const params = new URLSearchParams(
    search?.startsWith("?") ? search.slice(1) : (search ?? ""),
  );
  const employeeId =
    params.get("employeeId") ?? params.get("driverId") ?? undefined;
  return settlementsWorkbenchBucketPath(
    "approval",
    employeeId ? { employeeId } : undefined,
  );
}
