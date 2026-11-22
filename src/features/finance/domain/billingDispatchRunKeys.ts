import type { DispatchRunStatus } from "./billingDispatchRun.types";

/**
 * Query keys de corridas de despacho (ADR-0082) — contrato de invalidación.
 */
export const billingDispatchRunKeys = {
  all: ["billing-dispatch-runs"] as const,
  list: (params?: {
    status?: DispatchRunStatus;
    billingSchemeId?: string;
    excludeEmptyScheduled?: boolean;
    page?: number;
    limit?: number;
  }) => [...billingDispatchRunKeys.all, "list", params ?? {}] as const,
  detail: (id: string) =>
    [...billingDispatchRunKeys.all, "detail", id] as const,
  periodPreview: (billingSchemeId: string) =>
    [...billingDispatchRunKeys.all, "period-preview", billingSchemeId] as const,
};
