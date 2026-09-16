import type {
  ListAdvancesParams,
  ListSettlementsParams,
  ListWorkbenchParams,
} from "../infrastructure/settlementsApi";
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

  workbench: () => [...settlementsQueryKeys.all, "workbench"] as const,
  workbenchList: (params: ListWorkbenchParams) =>
    [...settlementsQueryKeys.workbench(), params] as const,

  settings: () => [...settlementsQueryKeys.all, "settings"] as const,
};
