import { useQuery } from "@tanstack/react-query";
import { settlementsApi } from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";
import type { PreviewSettlementQueryParams } from "../../presentation/validation/settlementSchemas";

export function useSettlementPreview(
  params: PreviewSettlementQueryParams | null,
  options?: { enabled?: boolean },
) {
  const isEnabled =
    options?.enabled !== false &&
    !!params &&
    !!params.employeeId &&
    !!params.periodStart &&
    !!params.periodEnd;

  return useQuery({
    queryKey: params
      ? settlementsQueryKeys.preview(params)
      : [...settlementsQueryKeys.all, "preview", "idle"],
    queryFn: () => {
      if (!params) throw new Error("Params required");
      return settlementsApi.previewSettlement(params);
    },
    enabled: isEnabled,
  });
}

/** ADR-0085 E11 punto 9: reembolsos pendientes del operador para un «Pago de reembolsos». */
export function useReimbursementSettlementPreview(employeeId: string | null) {
  return useQuery({
    queryKey: settlementsQueryKeys.reimbursementPreview(employeeId ?? ""),
    queryFn: () => settlementsApi.previewReimbursementSettlement(employeeId as string),
    enabled: !!employeeId,
  });
}
