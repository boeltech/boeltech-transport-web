import type {
  ListAdvancesParams,
  ListOperatorsParams,
  ListSettlementsParams,
  ListWorkbenchParams,
} from "../infrastructure/settlementsApi";
import type { PreviewSettlementCutPayload } from "../domain/settlementCut";
import type { PreviewSettlementQueryParams } from "../presentation/validation/settlementSchemas";

export const settlementsQueryKeys = {
  all: ["settlements"] as const,

  // Agreements
  agreements: () => [...settlementsQueryKeys.all, "agreements"] as const,
  agreementsList: (employeeId?: string) =>
    [...settlementsQueryKeys.agreements(), { employeeId }] as const,

  // Advances
  advances: () => [...settlementsQueryKeys.all, "advances"] as const,
  advancesList: (params: ListAdvancesParams) =>
    [...settlementsQueryKeys.advances(), params] as const,
  advanceDetail: (id: string) =>
    [...settlementsQueryKeys.advances(), "detail", id] as const,

  // Settlements
  settlements: () => [...settlementsQueryKeys.all, "settlements"] as const,
  settlementsList: (params: ListSettlementsParams) =>
    [...settlementsQueryKeys.settlements(), params] as const,
  settlementDetail: (id: string) =>
    [...settlementsQueryKeys.settlements(), "detail", id] as const,

  // Preview
  preview: (params: PreviewSettlementQueryParams) =>
    [...settlementsQueryKeys.all, "preview", params] as const,
  reimbursementPreview: (employeeId: string) =>
    [...settlementsQueryKeys.all, "preview", "reimbursement_only", employeeId] as const,

  // Cut preview (F6)
  cutPreview: (params: PreviewSettlementCutPayload) =>
    [...settlementsQueryKeys.all, "cut-preview", params] as const,

  workbench: () => [...settlementsQueryKeys.all, "workbench"] as const,
  workbenchList: (params: ListWorkbenchParams) =>
    [...settlementsQueryKeys.workbench(), params] as const,

  navBadges: () => [...settlementsQueryKeys.all, "nav-badges"] as const,

  settings: () => [...settlementsQueryKeys.all, "settings"] as const,

  // Operators readiness (F3)
  operators: () => [...settlementsQueryKeys.all, "operators"] as const,
  operatorsList: (params: ListOperatorsParams) =>
    [...settlementsQueryKeys.operators(), params] as const,
};
